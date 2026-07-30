import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ChatMessage } from "./types";

export async function generateWithGemini(
  messages: ChatMessage[],
  options?: { model?: string },
): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName =
    options?.model || process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const model = genAI.getGenerativeModel({ model: modelName });

  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const rest = messages.filter((m) => m.role !== "system");

  const history = rest.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const last = rest[rest.length - 1];
  if (!last) throw new Error("No user message provided for Gemini");

  const chat = model.startChat({
    history,
    systemInstruction: system || undefined,
  });

  const result = await chat.sendMessage(last.content);
  const text = result.response.text();
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}
