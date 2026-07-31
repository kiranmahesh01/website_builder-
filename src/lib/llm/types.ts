export type LlmProvider =
  | "nvidia"
  | "openai"
  | "gemini"
  | "bytez"
  | "openrouter"
  | "openrouter-best"
  | "demo";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function availableProviders(): LlmProvider[] {
  const providers: LlmProvider[] = [];
  if (process.env.NVIDIA_API_KEY) providers.push("nvidia");
  if (process.env.OPENROUTER_API_KEY) {
    providers.push("openrouter");
  }
  if (process.env.OPENAI_API_KEY) providers.push("openai");
  if (process.env.GOOGLE_AI_API_KEY) providers.push("gemini");
  if (process.env.BYTEZ_API_KEY) providers.push("bytez");
  if (process.env.OPENROUTER_API_KEY) {
    providers.push("openrouter-best");
  }
  providers.push("demo");
  return providers;
}

/**
 * Production default: NVIDIA NIM first — its free tier is rate limited rather
 * than credit limited and its models follow JSON instructions far more
 * reliably than the OpenRouter free pool.
 */
export function getDefaultProvider(): LlmProvider {
  if (process.env.NVIDIA_API_KEY) return "nvidia";
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GOOGLE_AI_API_KEY) return "gemini";
  if (process.env.BYTEZ_API_KEY) return "bytez";
  return "demo";
}

function missingProviderMessage(provider: LlmProvider): string {
  switch (provider) {
    case "nvidia":
      return "NVIDIA NIM is not configured. Get a free key at https://build.nvidia.com and set NVIDIA_API_KEY in .env.";
    case "openai":
      return "OpenAI is not configured. Set OPENAI_API_KEY in .env, or switch to Demo (no API key).";
    case "gemini":
      return "Gemini is not configured. Set GOOGLE_AI_API_KEY in .env, or switch to Demo (no API key).";
    case "bytez":
      return "Bytez is not configured. Set BYTEZ_API_KEY in .env (free key: https://bytez.com/api/key), or switch to Demo (no API key).";
    case "openrouter":
    case "openrouter-best":
      return "OpenRouter is not configured. Set OPENROUTER_API_KEY in .env (https://openrouter.ai/keys), or switch to Demo (no API key).";
    default:
      return "Provider is not configured.";
  }
}

export function resolveProvider(preferred?: string | null): LlmProvider {
  const available = availableProviders();

  // Honour an explicit, configured choice before falling back to defaults.
  if (preferred && preferred !== "demo" && available.includes(preferred as LlmProvider)) {
    return preferred as LlmProvider;
  }

  // NVIDIA NIM is the primary provider whenever its key is configured.
  if (process.env.NVIDIA_API_KEY && preferred !== "demo") {
    return "nvidia";
  }

  if (process.env.OPENROUTER_API_KEY && preferred !== "demo") {
    if (preferred === "openrouter-best" && available.includes("openrouter-best")) {
      return "openrouter-best";
    }
    if (preferred === "openai" && available.includes("openai")) return "openai";
    if (preferred === "gemini" && available.includes("gemini")) return "gemini";
    if (preferred === "bytez" && available.includes("bytez")) return "bytez";
    return "openrouter";
  }

  if (
    preferred === "nvidia" ||
    preferred === "openai" ||
    preferred === "gemini" ||
    preferred === "bytez" ||
    preferred === "openrouter" ||
    preferred === "openrouter-best" ||
    preferred === "demo"
  ) {
    if (available.includes(preferred)) return preferred;
    if (
      preferred === "nvidia" ||
      preferred === "openai" ||
      preferred === "gemini" ||
      preferred === "bytez" ||
      preferred === "openrouter" ||
      preferred === "openrouter-best"
    ) {
      throw new Error(missingProviderMessage(preferred));
    }
  }

  const fromEnv = process.env.DEFAULT_LLM_PROVIDER as LlmProvider | undefined;
  if (fromEnv && fromEnv !== "demo" && available.includes(fromEnv)) {
    return fromEnv;
  }

  const fallback = getDefaultProvider();
  if (available.includes(fallback)) return fallback;
  if (available[0]) return available[0];
  throw new Error(
    "No LLM providers available. Set OPENROUTER_API_KEY in Vercel env (https://openrouter.ai/keys).",
  );
}

/** Legacy HTML prompts kept for raw-HTML fallback path. */
export const WEBSITE_SYSTEM_PROMPT = `You are Magic AI, an expert website designer and frontend engineer.
You build complete, production-quality single-page websites as self-contained HTML documents.

Rules:
- Return ONLY a full HTML document starting with <!DOCTYPE html>. No markdown fences, no commentary.
- Include all CSS in a <style> tag and any JS in a <script> tag.
- Make the site visually distinctive: expressive typography (use Google Fonts via <link>), atmospheric backgrounds (gradients, subtle patterns), strong brand hierarchy.
- Avoid generic AI aesthetics: no purple-on-white themes, no cream+terracotta defaults, no broadsheet newspaper layouts, no excessive pill badges or glow spam.
- Hero should feel like one composition: brand name prominent, one headline, one short supporting sentence, one CTA group, one dominant visual idea.
- Mobile responsive. Accessible semantic HTML.
- Use placeholder images from https://images.unsplash.com when needed.
- Match the user's business/niche with real-looking copy, not lorem ipsum.
- Include navigation, hero, 2–4 content sections, and footer unless the user asks otherwise.`;

export const REFINE_SYSTEM_PROMPT = `You are Magic AI refining an existing website.
You receive the current full HTML and a user change request.
Return ONLY the complete updated HTML document (starting with <!DOCTYPE html>). No markdown fences, no commentary.
Preserve what works; apply the requested changes carefully. Keep the site self-contained with inline CSS/JS.`;

export function extractHtml(text: string): string {
  const fenced = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const doctype = text.indexOf("<!DOCTYPE");
  const htmlTag = text.toLowerCase().indexOf("<html");
  const start = doctype >= 0 ? doctype : htmlTag;
  if (start >= 0) return text.slice(start).trim();
  return text.trim();
}

/**
 * Rebuilds JSON that was cut off mid-value, which is how small free models
 * usually fail: closes an open string, drops a dangling key or comma, and
 * balances the remaining brackets.
 */
function repairTruncatedJson(text: string): string | null {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  let stringStart = -1;

  // Longest prefix that ends on a value boundary, plus the brackets open there.
  let safeEnd = -1;
  let safeStack: string[] = [];
  const markSafe = (end: number) => {
    safeEnd = end;
    safeStack = [...stack];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
        // A completed string is a safe boundary only when it is a value:
        // after ':' anywhere, or after ',' / '[' inside an array. After ','
        // inside an object it is a key still waiting for its value.
        const before = text.slice(0, stringStart).trimEnd();
        const prev = before[before.length - 1];
        const inArray = stack[stack.length - 1] === "]";
        if (prev === ":" || (inArray && (prev === "," || prev === "["))) {
          markSafe(i + 1);
        }
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      stringStart = i;
    } else if (char === "{" || char === "[") {
      stack.push(char === "{" ? "}" : "]");
      markSafe(i + 1);
    } else if (char === "}" || char === "]") {
      if (stack[stack.length - 1] !== char) return null;
      stack.pop();
      if (stack.length === 0) return text.slice(0, i + 1);
      markSafe(i + 1);
    } else if (char === ",") {
      markSafe(i);
    }
  }

  if (stack.length === 0 || safeEnd < 0) return null;

  const body = text.slice(0, safeEnd).replace(/[,:]\s*$/, "");
  return `${body}${[...safeStack].reverse().join("")}`;
}

export function extractJsonObject(text: string): unknown | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] || text).trim();

  try {
    return JSON.parse(candidate);
  } catch {
    // fall through to progressively more forgiving strategies
  }

  const start = candidate.indexOf("{");
  if (start < 0) return null;

  const sliced = candidate.slice(start);
  const end = sliced.lastIndexOf("}");
  if (end > 0) {
    try {
      return JSON.parse(sliced.slice(0, end + 1));
    } catch {
      // the braces balance but the content is malformed — try repairing
    }
  }

  const repaired = repairTruncatedJson(sliced);
  if (!repaired) return null;
  try {
    return JSON.parse(repaired);
  } catch {
    return null;
  }
}
