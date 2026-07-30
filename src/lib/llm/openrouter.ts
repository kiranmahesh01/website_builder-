import OpenAI from "openai";
import type { ChatMessage } from "./types";
import {
  isRetryableOpenRouterError,
  openRouterModelChain,
  supportsJsonObject,
} from "./openrouter-models";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

function buildClient(apiKey: string) {
  return new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE,
    defaultHeaders: {
      "HTTP-Referer":
        process.env.AUTH_URL || "https://websitebuilder-main.vercel.app",
      "X-Title": "Magic AI",
    },
  });
}

async function callModel(
  client: OpenAI,
  model: string,
  messages: ChatMessage[],
  options: { maxTokens: number; wantJson: boolean },
): Promise<string> {
  const attempt = async (useJson: boolean) => {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.45,
      max_tokens: options.maxTokens,
      ...(useJson ? { response_format: { type: "json_object" } } : {}),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const content = completion.choices[0]?.message?.content;
    if (!content?.trim()) {
      throw new Error(`OpenRouter (${model}) returned an empty response`);
    }
    return content;
  };

  if (!options.wantJson) {
    return attempt(false);
  }

  try {
    return await attempt(true);
  } catch (error) {
    if (
      error instanceof Error &&
      /400|response_format|Provider returned error/i.test(error.message)
    ) {
      return attempt(false);
    }
    throw error;
  }
}

function normalizeError(error: unknown, model: string): Error {
  const message =
    error instanceof Error ? error.message : "OpenRouter request failed";

  if (/401|403|invalid.*key|unauthorized/i.test(message)) {
    return new Error(
      "OpenRouter API key is invalid. Update OPENROUTER_API_KEY in Vercel env (https://openrouter.ai/keys).",
    );
  }
  if (/402|credit|quota|billing/i.test(message)) {
    return new Error(
      "OpenRouter credits exhausted on paid model. Free models will be tried automatically — or add credits at openrouter.ai/settings/credits.",
    );
  }
  if (/429|rate/i.test(message)) {
    return new Error(
      `OpenRouter rate limit on ${model}. Retrying with another model…`,
    );
  }
  return new Error(`OpenRouter (${model}): ${message}`);
}

export async function generateWithOpenRouter(
  messages: ChatMessage[],
  options?: { model?: string; json?: boolean; maxTokens?: number },
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const client = buildClient(apiKey);
  const maxTokens = options?.maxTokens ?? 6500;
  const chain = openRouterModelChain(options?.model);
  const errors: string[] = [];

  for (const model of chain) {
    const wantJson = options?.json === true && supportsJsonObject(model);
    try {
      return await callModel(client, model, messages, { maxTokens, wantJson });
    } catch (error) {
      const err = normalizeError(error, model);
      errors.push(err.message);
      if (!isRetryableOpenRouterError(err.message)) {
        throw err;
      }
    }
  }

  throw new Error(
    `All OpenRouter models failed. ${errors.slice(-3).join(" | ")}`,
  );
}

export { supportsJsonObject, openRouterModelChain } from "./openrouter-models";
