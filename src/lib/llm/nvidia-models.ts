/**
 * NVIDIA NIM (build.nvidia.com) — OpenAI-compatible catalog of hosted models.
 *
 * Free tier is rate limited (~40 requests/minute) rather than credit limited,
 * so the chain below prefers faster models first, then stronger/slower
 * quality fallbacks; the caller falls through on 429/empty/invalid JSON.
 */

export const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

/**
 * Ordered by measured fitness for the spec pipeline (probed July 2026), not by
 * raw benchmark rank. The pipeline makes several sequential calls inside a
 * 120s request budget, so a frontier model that needs 60-90s per call is
 * unusable here even though its output is excellent.
 *
 * Measured single-call latency on a JSON site-plan prompt:
 *   deepseek-v4-flash (primary) · gpt-oss-120b · nemotron-3-ultra ·
 *   deepseek-v4-flash 27s · glm-5.2 60s · deepseek-v4-pro 80s
 *
 * Re-measure with `npx tsx scripts/probe-nvidia.ts` and override via
 * NVIDIA_MODEL / NVIDIA_FALLBACK_MODELS; the catalog changes often.
 */
/**
 * Auto-fallback chain: deepseek-v4-flash → gpt-oss-120b → nemotron-3-ultra.
 * Slow GLM / DeepSeek Pro are omitted from the default chain.
 */
export const NVIDIA_MODEL_CANDIDATES = [
  "deepseek-ai/deepseek-v4-flash",
  "openai/gpt-oss-120b",
  "nvidia/nemotron-3-ultra-550b-a55b",
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
    role: "DeepSeek Flash → GPT-OSS 120B → Ultra",
  },
  {
    id: "deepseek-ai/deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    role: "Primary — thinking (medium effort)",
  },
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    role: "Strong GPT-OSS fallback",
  },
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b",
    label: "Nemotron Ultra 550B",
    role: "Last-resort quality (slower)",
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
  if (
    id.includes("reasoning") ||
    id.includes("-r1") ||
    id.includes("thinking") ||
    id.includes("nemotron-3-ultra") ||
    id.includes("deepseek-v4")
  ) {
    return false;
  }
  return true;
}

/** DeepSeek V4 Flash — thinking via chat_template_kwargs. */
export function isDeepseekFlashModel(model: string): boolean {
  return model.toLowerCase().includes("deepseek-v4-flash");
}

/** Huge thinking model — keep last in the chain and cap token budgets. */
export function isNvidiaUltraModel(model: string): boolean {
  return model.toLowerCase().includes("nemotron-3-ultra");
}

export function isRetryableNvidiaError(message: string): boolean {
  return /429|rate limit|too many requests|404|not found|unavailable|overloaded|capacity|timeout|500|502|503|504|empty response|invalid json/i.test(
    message,
  );
}
