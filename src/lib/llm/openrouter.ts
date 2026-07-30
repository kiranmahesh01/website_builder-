import OpenAI from "openai";
import type { ChatMessage } from "./types";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

function supportsJsonObject(model: string): boolean {
  const id = model.toLowerCase();
  return (
    id.includes("gpt-4o") ||
    id.includes("gpt-4.1") ||
    id.includes("gpt-5") ||
    id.includes("o1") ||
    id.includes("o3") ||
    id.includes("claude") ||
    id.includes("gemini")
  );
}

export async function generateWithOpenRouter(
  messages: ChatMessage[],
  options?: { model?: string; json?: boolean },
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const client = new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE,
    defaultHeaders: {
      "HTTP-Referer":
        process.env.AUTH_URL || "https://websitebuilder-main.vercel.app",
      "X-Title": "Magic AI",
    },
  });

  const model =
    options?.model || process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

  const wantJson = options?.json !== false && supportsJsonObject(model);

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.65,
      max_tokens: 8192,
      ...(wantJson ? { response_format: { type: "json_object" } } : {}),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error(`OpenRouter (${model}) returned an empty response`);
    return content;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OpenRouter request failed";
    if (/401|403|invalid.*key|unauthorized/i.test(message)) {
      throw new Error(
        "OpenRouter API key is invalid or missing credits. Update OPENROUTER_API_KEY in Vercel env.",
      );
    }
    if (/402|credit|quota|billing/i.test(message)) {
      throw new Error(
        "OpenRouter has no credits left for this key. Add credits or switch provider to Demo.",
      );
    }
    if (/429|rate/i.test(message)) {
      throw new Error(
        "OpenRouter rate limit hit. Wait a moment and try again, or switch to OpenRouter (single model).",
      );
    }
    throw new Error(`OpenRouter (${model}): ${message}`);
  }
}
