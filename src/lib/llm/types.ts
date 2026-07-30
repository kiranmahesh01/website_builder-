export type LlmProvider =
  | "openai"
  | "gemini"
  | "bytez"
  | "openrouter"
  | "demo";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function availableProviders(): LlmProvider[] {
  const providers: LlmProvider[] = [];
  if (process.env.OPENAI_API_KEY) providers.push("openai");
  if (process.env.GOOGLE_AI_API_KEY) providers.push("gemini");
  if (process.env.BYTEZ_API_KEY) providers.push("bytez");
  if (process.env.OPENROUTER_API_KEY) providers.push("openrouter");
  // Always available as a no-key fallback so Generate works out of the box.
  providers.push("demo");
  return providers;
}

function missingProviderMessage(provider: LlmProvider): string {
  switch (provider) {
    case "openai":
      return "OpenAI is not configured. Set OPENAI_API_KEY in .env, or switch to Demo (no API key).";
    case "gemini":
      return "Gemini is not configured. Set GOOGLE_AI_API_KEY in .env, or switch to Demo (no API key).";
    case "bytez":
      return "Bytez is not configured. Set BYTEZ_API_KEY in .env (free key: https://bytez.com/api/key), or switch to Demo (no API key).";
    case "openrouter":
      return "OpenRouter is not configured. Set OPENROUTER_API_KEY in .env (https://openrouter.ai/keys), or switch to Demo (no API key).";
    default:
      return "Provider is not configured.";
  }
}

export function resolveProvider(preferred?: string | null): LlmProvider {
  const available = availableProviders();
  if (
    preferred === "openai" ||
    preferred === "gemini" ||
    preferred === "bytez" ||
    preferred === "openrouter" ||
    preferred === "demo"
  ) {
    if (available.includes(preferred)) return preferred;
    if (
      preferred === "openai" ||
      preferred === "gemini" ||
      preferred === "bytez" ||
      preferred === "openrouter"
    ) {
      throw new Error(missingProviderMessage(preferred));
    }
  }
  const fallback = process.env.DEFAULT_LLM_PROVIDER as LlmProvider | undefined;
  if (fallback && available.includes(fallback)) return fallback;
  if (available[0]) return available[0];
  throw new Error(
    "No LLM providers available. Set OPENAI_API_KEY / GOOGLE_AI_API_KEY / BYTEZ_API_KEY / OPENROUTER_API_KEY, or use DEFAULT_LLM_PROVIDER=demo.",
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

export function extractJsonObject(text: string): unknown | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] || text).trim();
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}
