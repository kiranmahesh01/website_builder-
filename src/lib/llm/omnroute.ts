import OpenAI from "openai";
import type { ChatMessage } from "./types";
import {
  defaultOmniRouteModel,
  hasOmniRoute,
  isRetryableOmniRouteError,
  omnrouteBaseUrl,
} from "./omnroute-models";

/**
 * Build an OpenAI SDK client pointed at a self-hosted OmniRoute gateway.
 *
 * Auth: `Authorization: Bearer <key>` when OMNIROUTE_API_KEY is set.
 * Local OmniRoute often runs with REQUIRE_API_KEY=false — a placeholder key
 * is sent so the SDK is happy; the gateway ignores it when auth is off.
 */
function buildClient(): OpenAI {
  const apiKey =
    process.env.OMNIROUTE_API_KEY?.trim() || "omnroute-local-no-key";
  return new OpenAI({
    apiKey,
    baseURL: omnrouteBaseUrl(),
    defaultHeaders: {
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
      ...(useJson ? { response_format: { type: "json_object" as const } } : {}),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const content = completion.choices[0]?.message?.content;
    if (!content?.trim()) {
      throw new Error(`OmniRoute (${model}) returned an empty response`);
    }
    return content;
  };

  if (!options.wantJson) return attempt(false);

  try {
    return await attempt(true);
  } catch (error) {
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
    error instanceof Error ? error.message : "OmniRoute request failed";

  if (/ECONNREFUSED|fetch failed|ENOTFOUND|network/i.test(message)) {
    return new Error(
      `OmniRoute unreachable at ${omnrouteBaseUrl()}. Start it locally (npm i -g omniroute && omniroute) or Docker — see https://github.com/diegosouzapw/OmniRoute`,
    );
  }
  if (/401|403|invalid.*key|unauthorized/i.test(message)) {
    return new Error(
      "OmniRoute API key rejected. Create a key in Dashboard → Endpoints and set OMNIROUTE_API_KEY (or disable REQUIRE_API_KEY on OmniRoute for local use).",
    );
  }
  if (/429|rate/i.test(message)) {
    return new Error(`OmniRoute rate limit on ${model}.`);
  }
  return new Error(`OmniRoute (${model}): ${message}`);
}

export async function generateWithOmniRoute(
  messages: ChatMessage[],
  options?: { model?: string; json?: boolean; maxTokens?: number },
): Promise<string> {
  if (!hasOmniRoute()) {
    throw new Error(
      "OmniRoute is not configured. Set OMNIROUTE_BASE_URL (and usually OMNIROUTE_API_KEY) — https://github.com/diegosouzapw/OmniRoute",
    );
  }

  const client = buildClient();
  const maxTokens = options?.maxTokens ?? 6500;
  const model = options?.model?.trim() || defaultOmniRouteModel();
  const wantJson = options?.json === true;

  try {
    return await callModel(client, model, messages, { maxTokens, wantJson });
  } catch (error) {
    const err = normalizeError(error, model);
    if (!isRetryableOmniRouteError(err.message)) throw err;
    throw err;
  }
}

export {
  defaultOmniRouteModel,
  hasOmniRoute,
  omnrouteBaseUrl,
} from "./omnroute-models";
