import OpenAI from "openai";
import type { ChatMessage } from "./types";
import {
  isDeepseekFlashModel,
  isNvidiaUltraModel,
  isRetryableNvidiaError,
  nvidiaModelChain,
  nvidiaSupportsJsonObject,
  NVIDIA_BASE_URL,
} from "./nvidia-models";

function buildClient(apiKey: string) {
  return new OpenAI({ apiKey, baseURL: NVIDIA_BASE_URL });
}

/**
 * Optional per-model key overrides so different NIM keys can be used for
 * DeepSeek / GPT-OSS / Ultra. Falls back to NVIDIA_API_KEY for everything else.
 */
export function resolveNvidiaApiKey(model: string): string {
  const fallback = process.env.NVIDIA_API_KEY?.trim();
  const id = model.toLowerCase();

  let key: string | undefined;
  if (id.includes("deepseek")) {
    key = process.env.NVIDIA_API_KEY_DEEPSEEK?.trim() || fallback;
  } else if (id.includes("gpt-oss")) {
    key = process.env.NVIDIA_API_KEY_GPT_OSS?.trim() || fallback;
  } else if (id.includes("nemotron") && id.includes("ultra")) {
    key = process.env.NVIDIA_API_KEY_ULTRA?.trim() || fallback;
  } else {
    key = fallback;
  }

  if (!key) {
    throw new Error(
      "NVIDIA_API_KEY is not set. Get a free key at https://build.nvidia.com and set NVIDIA_API_KEY.",
    );
  }
  return key;
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

type NvidiaMessage = {
  content?: string | null;
  reasoning_content?: string | null;
  reasoning?: string | null;
};

/**
 * gpt-oss and other reasoning models often put the final answer in
 * `content`, but under tight max_tokens (or mid-thought cutoff) `content`
 * can be null while `reasoning_content` still holds recoverable JSON.
 */
function extractNvidiaText(message: NvidiaMessage | undefined): string {
  const primary = stripReasoning(message?.content ?? "");
  if (primary) return primary;

  // DeepSeek / gpt-oss / Nemotron may use either field when content is empty.
  const reasoning = stripReasoning(
    message?.reasoning_content || message?.reasoning || "",
  );
  if (!reasoning) return "";

  // Prefer a JSON object embedded in the reasoning trace.
  const jsonStart = reasoning.indexOf("{");
  if (jsonStart >= 0) {
    const fromJson = reasoning.slice(jsonStart).trim();
    if (fromJson) return fromJson;
  }
  return reasoning;
}

function nvidiaSampling(model: string, maxTokens: number) {
  if (isDeepseekFlashModel(model)) {
    return {
      temperature: 1,
      top_p: 0.95,
      // Cap well below 16k so JSON pipeline steps stay inside latency budget.
      max_tokens: Math.min(maxTokens, 8192),
      chat_template_kwargs: {
        thinking: true,
        reasoning_effort: "medium",
      },
    } as const;
  }
  if (isNvidiaUltraModel(model)) {
    // Ultra with thinking is slow; keep pipeline budgets bounded.
    return {
      temperature: 1,
      top_p: 0.95,
      max_tokens: Math.min(maxTokens, 8192),
      chat_template_kwargs: { enable_thinking: true },
      reasoning_budget: 4096,
    } as const;
  }
  return {
    temperature: 0.4,
    max_tokens: maxTokens,
  } as const;
}

async function callModel(
  client: OpenAI,
  model: string,
  messages: ChatMessage[],
  options: { maxTokens: number; useJsonFormat: boolean; expectJson: boolean },
): Promise<string> {
  const attempt = async (useJson: boolean) => {
    const sampling = nvidiaSampling(model, options.maxTokens);
    const completion = await client.chat.completions.create({
      model,
      ...sampling,
      ...(useJson ? { response_format: { type: "json_object" as const } } : {}),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const rawMessage = completion.choices[0]?.message as NvidiaMessage | undefined;
    const content = extractNvidiaText(rawMessage);
    if (!content) {
      throw new Error(`NVIDIA (${model}) returned an empty response`);
    }
    if (options.expectJson) {
      const trimmed = content.trim();
      const start = trimmed.indexOf("{");
      const end = trimmed.lastIndexOf("}");
      const candidate =
        start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed;
      try {
        JSON.parse(candidate);
      } catch {
        throw new Error(
          `NVIDIA (${model}) returned invalid json (unusable for pipeline)`,
        );
      }
    }
    return content;
  };

  if (!options.useJsonFormat) return attempt(false);

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
  if (/429|rate limit|too many requests|529|overloaded/i.test(message)) {
    return new Error(
      `NVIDIA rate limit/overloaded on ${model} (free tier is ~40 req/min; 529 = capacity). Trying the next model…`,
    );
  }
  return new Error(`NVIDIA (${model}): ${message}`);
}

export async function generateWithNvidia(
  messages: ChatMessage[],
  options?: { model?: string; json?: boolean; maxTokens?: number },
): Promise<string> {
  if (!process.env.NVIDIA_API_KEY?.trim()) {
    throw new Error("NVIDIA_API_KEY is not set");
  }

  const maxTokens = options?.maxTokens ?? 6500;
  const chain = nvidiaModelChain(options?.model);
  const errors: string[] = [];
  const expectJson = options?.json === true;
  const clients = new Map<string, OpenAI>();

  for (const model of chain) {
    const apiKey = resolveNvidiaApiKey(model);
    let client = clients.get(apiKey);
    if (!client) {
      client = buildClient(apiKey);
      clients.set(apiKey, client);
    }
    const useJsonFormat = expectJson && nvidiaSupportsJsonObject(model);
    try {
      return await callModel(client, model, messages, {
        maxTokens,
        useJsonFormat,
        expectJson,
      });
    } catch (error) {
      const err = normalizeError(error, model);
      errors.push(err.message);
      if (!isRetryableNvidiaError(err.message)) throw err;
    }
  }

  throw new Error(`All NVIDIA models failed. ${errors.slice(-3).join(" | ")}`);
}
