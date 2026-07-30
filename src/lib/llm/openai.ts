import OpenAI from "openai";
import type { ChatMessage } from "./types";

export async function generateWithOpenAI(
  messages: ChatMessage[],
  options?: { model?: string },
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const client = new OpenAI({ apiKey });
  const model = options?.model || process.env.OPENAI_MODEL || "gpt-4o-mini";

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.7,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned an empty response");
  return content;
}
