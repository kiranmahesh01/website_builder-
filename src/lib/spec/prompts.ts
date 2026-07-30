import { SECTION_REGISTRY } from "@/lib/sections/registry";
import {
  SITE_THEME_DESCRIPTIONS,
  SITE_THEME_LABELS,
  SITE_THEMES,
} from "@/lib/themes";

const SECTION_METADATA_JSON = JSON.stringify(
  SECTION_REGISTRY.map((s) => ({
    id: s.id,
    purpose: s.purpose,
    goodFor: s.goodFor,
    position: s.position,
    slots: s.slots,
  })),
  null,
  0,
);

const THEME_LIST = SITE_THEMES.map(
  (t) => `- ${t}: ${SITE_THEME_LABELS[t]} — ${SITE_THEME_DESCRIPTIONS[t]}`,
).join("\n");

export const PLAN_SYSTEM_PROMPT = `You are Magic AI's site planner. Output STRICT JSON only.

Pick a theme and outline pages from the user's business brief.

Themes (pick exactly one):
${THEME_LIST}

Output shape:
{
  "theme": "bold_startup" | "warm_editorial" | "minimal_studio",
  "brand": "Business name from brief",
  "pages": [
    { "slug": "home", "title": "Home", "intent": "One sentence: what this page must accomplish" }
  ]
}

Rules:
- Usually one page (slug "home"). Add a second only if the brief clearly needs it (e.g. shop + about).
- brand must come from the brief — never "Your Business" or generic placeholders.
- intent must reference the actual offer, city, and audience from the brief.
- Return ONLY valid JSON.`;

export const STRUCTURE_SYSTEM_PROMPT = `You are Magic AI's page architect. Output STRICT JSON only.

Given a page intent and section catalog, pick an ordered list of section ids.

Section catalog:
${SECTION_METADATA_JSON}

Output shape:
{ "sections": ["hero_split", "features_3col", ...] }

Rules:
- Exactly 5–8 section ids.
- First section MUST be hero_centered OR hero_split (position top).
- Last section MUST be footer_simple.
- Pick sections whose goodFor tags match the business type.
- SaaS → pricing_3tier, testimonial_single. Local business → contact_form, about_text. Agency → logos_strip, feature_image_left.
- Return ONLY valid JSON.`;

export function contentSystemPrompt(sectionIds: string[]): string {
  const metas = SECTION_REGISTRY.filter((s) => sectionIds.includes(s.id));
  const slotDocs = metas
    .map((s) => {
      const slots = Object.entries(s.slots)
        .map(([key, slot]) => {
          const limits =
            slot.type === "text" && slot.maxWords
              ? `max ${slot.maxWords} words`
              : slot.type === "list"
                ? `${slot.minItems ?? 1}–${slot.maxItems ?? 6} items`
                : slot.query
                  ? `{ "query": "stock photo search string" }`
                  : "";
          return `    ${key}: ${slot.type}${limits ? ` (${limits})` : ""}`;
        })
        .join("\n");
      return `- ${s.id}:\n${slots}`;
    })
    .join("\n");

  return `You are Magic AI's copywriter. Output STRICT JSON only.

Fill content slots for each section. Use the client's exact business name, offer, city, and niche language.

Sections to fill:
${slotDocs}

Output shape:
{
  "sections": [
    { "id": "hero_split", "content": { "headline": "...", "subhead": "...", "ctaLabel": "...", "image": { "query": "..." } } }
  ]
}

Rules:
- Respect word limits strictly — short, specific copy beats long generic prose.
- NEVER use: "welcome to our website", "cutting-edge solutions", "your trusted partner", "transform your business".
- headlines must name the real offer (e.g. "Single-origin pour-overs in Portland" not "Our features").
- features_3col items: array of { "title": string, "body": string } with exactly 3 items.
- pricing_3tier plans: array of { "name", "price", "period", "features": string[], "highlighted": boolean } — middle plan highlighted.
- faq_accordion items: array of { "question", "answer" } with 4–6 items.
- logos_strip logos: array of short company name strings (3–5).
- image slots: { "query": "specific unsplash search terms" } only.
- Return ONLY valid JSON with all listed sections.`;
}

export function planUserMessage(prompt: string): string {
  return `Business brief:\n${prompt}`;
}

export function structureUserMessage(intent: string, businessContext: string): string {
  return `Page intent: ${intent}\n\nBusiness context:\n${businessContext}`;
}

export function contentUserMessage(
  sections: string[],
  businessContext: string,
): string {
  return `Fill content for sections: ${sections.join(", ")}\n\nBusiness context:\n${businessContext}`;
}

export function sectionMetadataForPrompt(): string {
  return SECTION_METADATA_JSON;
}
