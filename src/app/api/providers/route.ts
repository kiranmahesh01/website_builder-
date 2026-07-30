import { NextResponse } from "next/server";
import { openRouterBestModels } from "@/lib/llm/openrouter-best";
import {
  DEFAULT_OPENROUTER_MODEL,
  FREE_OPENROUTER_MODELS,
  openRouterVisionModel,
} from "@/lib/llm/openrouter-models";
import { availableProviders, getDefaultProvider } from "@/lib/llm/types";

export async function GET() {
  return NextResponse.json({
    providers: availableProviders(),
    defaults: {
      provider: getDefaultProvider(),
    },
    models: {
      openrouter: process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL,
      "openrouter-best": openRouterBestModels().join(", "),
      "openrouter-free": FREE_OPENROUTER_MODELS.join(", "),
      vision: openRouterVisionModel(),
      openai: process.env.OPENAI_MODEL || "gpt-4o-mini",
      gemini: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      bytez: process.env.BYTEZ_MODEL || "Qwen/Qwen3-4B",
    },
  });
}
