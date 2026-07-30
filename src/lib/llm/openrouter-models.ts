/**
 * Curated OpenRouter models — verified against https://openrouter.ai/models?max_price=0
 * Updated for free-tier website generation (JSON spec pipeline + chat).
 */

/** Auto-routes to best available free model — best default when credits are low. */
export const DEFAULT_OPENROUTER_MODEL = "openrouter/free";

/** Multimodal free model for reference-image analysis in Creative Studio. */
export const DEFAULT_VISION_MODEL = "google/gemma-4-26b-a4b-it:free";

/** Free models that accept chat completions (tested Mar 2026). */
export const FREE_OPENROUTER_MODELS = [
  "openrouter/free",
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "openai/gpt-oss-20b:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
] as const;

/** Race these free models for legacy JSON site generation. */
export const DEFAULT_OPENROUTER_BEST_MODELS = [
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "openai/gpt-oss-20b:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
] as const;

/** Cheap paid fallback when free models are exhausted (still via OpenRouter). */
export const PAID_FALLBACK_MODEL = "openai/gpt-4o-mini";

export function parseModelList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function openRouterBestModels(): string[] {
  const fromEnv = parseModelList(process.env.OPENROUTER_BEST_MODELS);
  return fromEnv.length > 0 ? fromEnv : [...DEFAULT_OPENROUTER_BEST_MODELS];
}

/** Primary model + fallbacks — tries each until one succeeds. */
export function openRouterModelChain(explicit?: string | null): string[] {
  const primary =
    explicit?.trim() ||
    process.env.OPENROUTER_MODEL?.trim() ||
    DEFAULT_OPENROUTER_MODEL;

  const fallbacks = parseModelList(process.env.OPENROUTER_FALLBACK_MODELS);
  const chain = [
    primary,
    ...fallbacks,
    ...FREE_OPENROUTER_MODELS,
    PAID_FALLBACK_MODEL,
  ];

  return [...new Set(chain)];
}

/** Models that support response_format json_object (or reliably emit JSON). */
export function supportsJsonObject(model: string): boolean {
  const id = model.toLowerCase();
  if (id === "openrouter/free") return true;
  return (
    id.includes("gpt") ||
    id.includes("gemma") ||
    id.includes("nemotron") ||
    id.includes("claude") ||
    id.includes("gemini") ||
    id.includes("llama") ||
    id.includes("qwen") ||
    id.includes("mistral") ||
    id.includes("deepseek") ||
    id.includes("north-mini")
  );
}

export function isRetryableOpenRouterError(message: string): boolean {
  return /429|rate|404|unavailable|resourceexhausted|overloaded|capacity|timeout|502|503|504|provider returned error/i.test(
    message,
  );
}

export function openRouterVisionModel(): string {
  return (
    process.env.OPENROUTER_VISION_MODEL?.trim() || DEFAULT_VISION_MODEL
  );
}
