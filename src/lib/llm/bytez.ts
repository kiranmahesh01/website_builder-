import OpenAI from "openai";
import type { ChatMessage } from "./types";

const BYTEZ_OPENAI_BASE = "https://api.bytez.com/models/v2/openai/v1";

export async function generateWithBytez(
  messages: ChatMessage[],
  options?: { model?: string },
): Promise<string> {
  const apiKey = process.env.BYTEZ_API_KEY;
  if (!apiKey) throw new Error("BYTEZ_API_KEY is not set");

  const client = new OpenAI({
    apiKey,
    baseURL: BYTEZ_OPENAI_BASE,
  });

  // Free tier allows open models up to 7B; Qwen3-4B is Bytez's documented chat example.
  const model = options?.model || process.env.BYTEZ_MODEL || "Qwen/Qwen3-4B";

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.7,
    max_tokens: 8192,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Bytez returned an empty response");
  return content;
}
