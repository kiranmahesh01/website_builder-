import { generateWithOpenRouter } from "@/lib/llm/openrouter";
import { generateWithOmniRoute } from "@/lib/llm/omnroute";
import { generateWithNvidia } from "@/lib/llm/nvidia";
import { hasOmniRoute } from "@/lib/llm/omnroute-models";
import { extractJsonObject, getDefaultProvider, type LlmProvider } from "@/lib/llm/types";
import type { SiteSpec } from "./schema";
import { parseSiteSpec } from "./schema";

const REFINE_SPEC_PROMPT = `You are Magic AI. Apply a small patch to a website spec JSON based on the user's change request.

Rules:
- Return ONLY the complete updated SiteSpec JSON — same shape as input.
- Change only what the user asked for. Do not rewrite unrelated sections.
- Keep theme, brand, and section ids unless explicitly asked to change them.
- Respect slot word limits.
- No markdown, no commentary.`;

export async function refineSiteSpec(input: {
  spec: SiteSpec;
  instruction: string;
  provider?: LlmProvider;
  model?: string | null;
}): Promise<SiteSpec> {
  const provider = input.provider && input.provider !== "demo"
    ? input.provider
    : getDefaultProvider();

  const messages = [
    { role: "system" as const, content: REFINE_SPEC_PROMPT },
    {
      role: "user" as const,
      content: `Current spec:\n${JSON.stringify(input.spec)}\n\nChange request:\n${input.instruction}`,
    },
  ];

  async function tryParse(raw: string): Promise<SiteSpec | null> {
    const json = extractJsonObject(raw);
    return json ? parseSiteSpec(json) : null;
  }

  if (provider === "nvidia" && process.env.NVIDIA_API_KEY) {
    try {
      const raw = await generateWithNvidia(messages, {
        maxTokens: 3500,
        json: true,
        model: input.model || undefined,
      });
      const parsed = await tryParse(raw);
      if (parsed) return parsed;
    } catch {
      if (hasOmniRoute()) {
        const raw = await generateWithOmniRoute(messages, {
          maxTokens: 3500,
          json: true,
        });
        const parsed = await tryParse(raw);
        if (parsed) return parsed;
      } else if (process.env.OPENROUTER_API_KEY) {
        const raw = await generateWithOpenRouter(messages, {
          maxTokens: 3500,
          json: true,
          model: input.model || undefined,
        });
        const parsed = await tryParse(raw);
        if (parsed) return parsed;
      }
    }
  }

  if (provider === "omnroute" && hasOmniRoute()) {
    const raw = await generateWithOmniRoute(messages, {
      maxTokens: 3500,
      json: true,
      model: input.model || undefined,
    });
    const parsed = await tryParse(raw);
    if (parsed) return parsed;
  }

  if (provider === "openrouter" || process.env.OPENROUTER_API_KEY) {
    const raw = await generateWithOpenRouter(messages, {
      maxTokens: 3500,
      json: true,
      model: input.model || undefined,
    });
    const parsed = await tryParse(raw);
    if (parsed) return parsed;
  }

  return input.spec;
}
