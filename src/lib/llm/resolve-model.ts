import {
  defaultNvidiaModel,
  isAllowedNvidiaModel,
} from "./nvidia-models";
import {
  DEFAULT_OPENROUTER_MODEL,
  isAllowedOpenRouterModel,
} from "./openrouter-models";
import type { LlmProvider } from "./types";

export function defaultModelForProvider(provider: LlmProvider): string {
  if (provider === "nvidia") return defaultNvidiaModel();
  return process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
}

/**
 * Pick a model id that is valid for the active provider.
 * Never pairs OpenRouter free-pool ids with NVIDIA (or vice versa).
 */
export function resolveModel(
  provider: LlmProvider,
  requested?: string | null,
  stored?: string | null,
): string {
  if (provider === "nvidia") {
    if (isAllowedNvidiaModel(requested)) return requested!.trim();
    if (isAllowedNvidiaModel(stored)) return stored!.trim();
    return defaultNvidiaModel();
  }

  if (isAllowedOpenRouterModel(requested)) return requested!;
  if (isAllowedOpenRouterModel(stored)) return stored!;
  return defaultModelForProvider(provider);
}
