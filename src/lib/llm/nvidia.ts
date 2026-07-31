import OpenAI from "openai";
import type { ChatMessage } from "./types";
import {
  isRetryableNvidiaError,
  nvidiaModelChain,
  nvidiaSupportsJsonObject,
  NVIDIA_BASE_URL,
} from "./nvidia-models";

function buildClient(apiKey: string) {
  return new OpenAI({ apiKey, baseURL: NVIDIA_BASE_URL });
}

/**
 * Reasoning models on NIM usually return their chain of thought in a separate
 * `reasoning_content` field, but some inline it into the content as a <think>
 * block. Strip it so the JSON extractor only sees the answer.
 */
function stripReasoning(content: string): string {
  const withoutBlocks = content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "");

  // An unterminated opener means the model was cut off mid-thought.
  const dangling = withoutBlocks.search(/<(?:think|reasoning)>/i);
  const cleaned = dangling >= 0 ? withoutBlocks.slice(0, dangling) : withoutBlocks;

  return cleaned.trim();
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
      temperature: 0.4,
      max_tokens: options.maxTokens,
      ...(useJson ? { response_format: { type: "json_object" } } : {}),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const content = stripReasoning(completion.choices[0]?.message?.content ?? "");
    if (!content) {
      throw new Error(`NVIDIA (${model}) returned an empty response`);
    }
    return content;
  };

  if (!options.wantJson) return attempt(false);

  try {
    return await attempt(true);
  } catch (error) {
    // Not every catalog entry accepts response_format — retry as plain text
    // and let the JSON extractor recover the object.
    if (
      error instanceof Error &&
      /400|response_format|unsupported|invalid.*parameter/i.test(error.message)
    ) {
      return attempt(false);
    }
    throw error;
  }
}

function normalizeError(error: unknown, model: string): Error {
  const message =
    error instanceof Error ? error.message : "NVIDIA NIM request failed";

  if (/401|403|invalid.*key|unauthorized/i.test(message)) {
    return new Error(
      "NVIDIA API key is invalid. Get a free key at https://build.nvidia.com and set NVIDIA_API_KEY.",
    );
  }
  if (/429|rate limit|too many requests/i.test(message)) {
    return new Error(
      `NVIDIA rate limit on ${model} (free tier is ~40 req/min). Trying the next model…`,
    );
  }
  return new Error(`NVIDIA (${model}): ${message}`);
}

export async function generateWithNvidia(
  messages: ChatMessage[],
  options?: { model?: string; json?: boolean; maxTokens?: number },
): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error("NVIDIA_API_KEY is not set");

  const client = buildClient(apiKey);
  const maxTokens = options?.maxTokens ?? 6500;
  const chain = nvidiaModelChain(options?.model);
  const errors: string[] = [];

  for (const model of chain) {
    const wantJson = options?.json === true && nvidiaSupportsJsonObject(model);
    try {
      return await callModel(client, model, messages, { maxTokens, wantJson });
    } catch (error) {
      const err = normalizeError(error, model);
      errors.push(err.message);
      if (!isRetryableNvidiaError(err.message)) throw err;
    }
  }

  throw new Error(`All NVIDIA models failed. ${errors.slice(-3).join(" | ")}`);
}
