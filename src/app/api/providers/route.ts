import { NextResponse } from "next/server";
import { openRouterBestModels } from "@/lib/llm/openrouter-best";
import {
  DEFAULT_OPENROUTER_MODEL,
  FREE_OPENROUTER_MODELS,
  OPENROUTER_MODEL_OPTIONS,
  openRouterVisionModel,
} from "@/lib/llm/openrouter-models";
import {
  defaultNvidiaModel,
  NVIDIA_MODEL_OPTIONS,
  nvidiaModelChain,
  nvidiaVisionModel,
} from "@/lib/llm/nvidia-models";
import { defaultModelForProvider } from "@/lib/llm/resolve-model";
import { availableProviders, getDefaultProvider } from "@/lib/llm/types";

export async function GET() {
  const defaultProvider = getDefaultProvider();
  const nvidiaDefault = defaultNvidiaModel();
  const nvidiaOptions = NVIDIA_MODEL_OPTIONS.map((option, index) =>
    index === 0
      ? {
          ...option,
          id: nvidiaDefault,
          label: "Auto (NVIDIA)",
          role: "Default — NVIDIA NIM primary + fallbacks",
        }
      : option,
  ).filter(
    (option, index, all) => all.findIndex((o) => o.id === option.id) === index,
  );

  return NextResponse.json({
    providers: availableProviders(),
    defaults: {
      provider: defaultProvider,
      model: defaultModelForProvider(defaultProvider),
    },
    models: {
      nvidia: nvidiaDefault,
      "nvidia-chain": nvidiaModelChain().join(", "),
      "nvidia-vision": nvidiaVisionModel(),
      openrouter: process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL,
      "openrouter-best": openRouterBestModels().join(", "),
      "openrouter-free": FREE_OPENROUTER_MODELS.join(", "),
      vision: openRouterVisionModel(),
      openai: process.env.OPENAI_MODEL || "gpt-4o-mini",
      gemini: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      bytez: process.env.BYTEZ_MODEL || "Qwen/Qwen3-4B",
    },
    openrouterOptions: OPENROUTER_MODEL_OPTIONS,
    nvidiaOptions,
  });
}
