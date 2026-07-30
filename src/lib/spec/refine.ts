import { generateWithOpenRouter } from "@/lib/llm/openrouter";
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

  if (provider === "openrouter") {
    const raw = await generateWithOpenRouter(messages, { maxTokens: 3500, json: true });
    const json = extractJsonObject(raw);
    const parsed = json ? parseSiteSpec(json) : null;
    if (parsed) return parsed;
  }

  return input.spec;
}
