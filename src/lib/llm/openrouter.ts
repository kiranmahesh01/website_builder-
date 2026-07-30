import OpenAI from "openai";
import type { ChatMessage } from "./types";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export async function generateWithOpenRouter(
  messages: ChatMessage[],
  options?: { model?: string },
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const client = new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE,
    defaultHeaders: {
      "HTTP-Referer": process.env.AUTH_URL || "http://localhost:3000",
      "X-Title": "Magic AI",
    },
  });

  // Default to GPT-4o mini via OpenRouter; override with OPENROUTER_MODEL.
  const model =
    options?.model || process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.7,
    max_tokens: 8192,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned an empty response");
  return content;
}
