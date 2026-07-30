import { NextResponse } from "next/server";
import { openRouterBestModels } from "@/lib/llm/openrouter-best";
import { availableProviders } from "@/lib/llm/types";

export async function GET() {
  return NextResponse.json({
    providers: availableProviders(),
    defaults: {
      // Prefer reliable single-model OpenRouter when a key exists.
      provider:
        process.env.DEFAULT_LLM_PROVIDER ||
        (process.env.OPENROUTER_API_KEY ? "openrouter" : "demo"),
    },
    models: {
      openrouter: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      "openrouter-best": openRouterBestModels().join(", "),
      openai: process.env.OPENAI_MODEL || "gpt-4o-mini",
      gemini: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      bytez: process.env.BYTEZ_MODEL || "Qwen/Qwen3-4B",
    },
  });
}
