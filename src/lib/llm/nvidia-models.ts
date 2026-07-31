/**
 * NVIDIA NIM (build.nvidia.com) — OpenAI-compatible catalog of hosted models.
 *
 * Free tier is rate limited (~40 requests/minute) rather than credit limited,
 * so the chain below is ordered by output quality first and the caller is
 * expected to fall through on 429.
 */

export const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

/**
 * Ordered by measured fitness for the spec pipeline (probed July 2026), not by
 * raw benchmark rank. The pipeline makes several sequential calls inside a
 * 120s request budget, so a frontier model that needs 60-90s per call is
 * unusable here even though its output is excellent.
 *
 * Measured single-call latency on a JSON site-plan prompt:
 *   gpt-oss-120b 5s · nemotron-3-super 7s · minimax-m3 22s ·
 *   deepseek-v4-flash 27s · glm-5.2 60s · deepseek-v4-pro 80s
 *
 * Re-measure with `npx tsx scripts/probe-nvidia.ts` and override via
 * NVIDIA_MODEL / NVIDIA_FALLBACK_MODELS; the catalog changes often.
 */
export const NVIDIA_MODEL_CANDIDATES = [
  "openai/gpt-oss-120b",
  "nvidia/nemotron-3-super-120b-a12b",
  "minimaxai/minimax-m3",
  "deepseek-ai/deepseek-v4-flash",
  "z-ai/glm-5.2",
  "deepseek-ai/deepseek-v4-pro",
] as const;

export const DEFAULT_NVIDIA_MODEL = NVIDIA_MODEL_CANDIDATES[0];

/** Multimodal entry for reference-image analysis in Creative Studio. */
export const DEFAULT_NVIDIA_VISION_MODEL = "meta/llama-3.2-90b-vision-instruct";

function parseList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** OpenRouter auto/free ids must never be sent to NVIDIA NIM. */
export function isOpenRouterStyleModel(model: string | null | undefined): boolean {
  if (!model) return false;
  const id = model.trim().toLowerCase();
  return (
    id === "openrouter/free" ||
    id.startsWith("openrouter/") ||
    id.endsWith(":free")
  );
}

export function defaultNvidiaModel(): string {
  return process.env.NVIDIA_MODEL?.trim() || DEFAULT_NVIDIA_MODEL;
}

/**
 * Accept configured NIM ids and other org/model slugs, but reject OpenRouter
 * free-pool ids (including the "Auto (free)" picker value).
 */
export function isAllowedNvidiaModel(model: string | null | undefined): boolean {
  if (!model?.trim()) return false;
  if (isOpenRouterStyleModel(model)) return false;
  const id = model.trim();
  if ((NVIDIA_MODEL_CANDIDATES as readonly string[]).includes(id)) return true;
  if (id === defaultNvidiaModel()) return true;
  // NIM ids look like org/model — allow explicit overrides from the UI/env.
  return /^[a-z0-9._-]+\/[a-z0-9._-]+$/i.test(id);
}

export const NVIDIA_MODEL_OPTIONS: {
  id: string;
  label: string;
  role: string;
}[] = [
  {
    id: DEFAULT_NVIDIA_MODEL,
    label: "Auto (NVIDIA)",
    role: "Default — NVIDIA NIM primary + fallbacks",
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b",
    label: "Nemotron Super",
    role: "Strong NVIDIA fallback",
  },
  {
    id: "minimaxai/minimax-m3",
    label: "MiniMax M3",
    role: "Balanced NVIDIA fallback",
  },
  {
    id: "deepseek-ai/deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    role: "Faster NVIDIA fallback",
  },
];

/** Primary model plus fallbacks, tried in order until one answers. */
export function nvidiaModelChain(explicit?: string | null): string[] {
  const requested = explicit?.trim();
  const primary =
    (requested && !isOpenRouterStyleModel(requested) ? requested : null) ||
    process.env.NVIDIA_MODEL?.trim() ||
    DEFAULT_NVIDIA_MODEL;

  const configured = parseList(process.env.NVIDIA_FALLBACK_MODELS);
  const chain = [primary, ...configured, ...NVIDIA_MODEL_CANDIDATES].filter(
    (m) => m && !isOpenRouterStyleModel(m),
  );

  return [...new Set(chain.length > 0 ? chain : [DEFAULT_NVIDIA_MODEL])];
}

export function nvidiaVisionModel(): string {
  return process.env.NVIDIA_VISION_MODEL?.trim() || DEFAULT_NVIDIA_VISION_MODEL;
}

/**
 * NIM accepts response_format json_object on most chat models, but reasoning
 * models wrap output in think tags and behave badly with it.
 */
export function nvidiaSupportsJsonObject(model: string): boolean {
  const id = model.toLowerCase();
  if (id.includes("reasoning") || id.includes("-r1") || id.includes("thinking")) {
    return false;
  }
  return true;
}

export function isRetryableNvidiaError(message: string): boolean {
  return /429|rate limit|too many requests|404|not found|unavailable|overloaded|capacity|timeout|500|502|503|504|empty response|invalid json/i.test(
    message,
  );
}
