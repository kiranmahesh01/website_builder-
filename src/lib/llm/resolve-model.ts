import {
  defaultNvidiaModel,
  isAllowedNvidiaModel,
} from "./nvidia-models";
import {
  defaultOmniRouteModel,
  isAllowedOmniRouteModel,
} from "./omnroute-models";
import {
  DEFAULT_OPENROUTER_MODEL,
  isAllowedOpenRouterModel,
} from "./openrouter-models";
import type { LlmProvider } from "./types";

export function defaultModelForProvider(provider: LlmProvider): string {
  if (provider === "nvidia") return defaultNvidiaModel();
  if (provider === "omnroute") return defaultOmniRouteModel();
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

  if (provider === "omnroute") {
    if (isAllowedOmniRouteModel(requested)) return requested!.trim();
    if (isAllowedOmniRouteModel(stored)) return stored!.trim();
    return defaultOmniRouteModel();
  }

  if (isAllowedOpenRouterModel(requested)) return requested!;
  if (isAllowedOpenRouterModel(stored)) return stored!;
  return defaultModelForProvider(provider);
}
