/**
 * Section metadata for the spec-driven pipeline (Weeks 1–3).
 * The planner reads these records — never the component source.
 */

export type SlotType = "text" | "image" | "list";

export type SectionSlot = {
  type: SlotType;
  maxWords?: number;
  ratio?: string;
  query?: boolean;
  minItems?: number;
  maxItems?: number;
};

export type SectionMeta = {
  id: string;
  purpose: string;
  goodFor: string[];
  position: "top" | "body" | "bottom";
  slots: Record<string, SectionSlot>;
};

export const SECTION_REGISTRY: SectionMeta[] = [
  {
    id: "hero_centered",
    purpose: "Homepage opener with centered headline and CTA",
    goodFor: ["local", "restaurant", "portfolio", "consultant"],
    position: "top",
    slots: {
      headline: { type: "text", maxWords: 8 },
      subhead: { type: "text", maxWords: 25 },
      ctaLabel: { type: "text", maxWords: 3 },
    },
  },
  {
    id: "hero_split",
    purpose: "Homepage opener with supporting image",
    goodFor: ["saas", "agency", "product", "portfolio"],
    position: "top",
    slots: {
      headline: { type: "text", maxWords: 8 },
      subhead: { type: "text", maxWords: 25 },
      ctaLabel: { type: "text", maxWords: 3 },
      image: { type: "image", ratio: "16:9", query: true },
    },
  },
  {
    id: "logos_strip",
    purpose: "Social proof via client or partner logos",
    goodFor: ["saas", "agency", "b2b"],
    position: "body",
    slots: {
      headline: { type: "text", maxWords: 6 },
      logos: { type: "list", minItems: 3, maxItems: 6 },
    },
  },
  {
    id: "features_3col",
    purpose: "Three feature cards with icon, title, body",
    goodFor: ["saas", "product", "service", "local"],
    position: "body",
    slots: {
      headline: { type: "text", maxWords: 6 },
      items: { type: "list", minItems: 3, maxItems: 3 },
    },
  },
  {
    id: "feature_image_left",
    purpose: "Single feature with image on the left",
    goodFor: ["product", "saas", "agency"],
    position: "body",
    slots: {
      headline: { type: "text", maxWords: 8 },
      body: { type: "text", maxWords: 40 },
      image: { type: "image", ratio: "4:3", query: true },
    },
  },
  {
    id: "feature_image_right",
    purpose: "Single feature with image on the right",
    goodFor: ["product", "saas", "agency"],
    position: "body",
    slots: {
      headline: { type: "text", maxWords: 8 },
      body: { type: "text", maxWords: 40 },
      image: { type: "image", ratio: "4:3", query: true },
    },
  },
  {
    id: "testimonial_single",
    purpose: "One quote with name, role, and photo",
    goodFor: ["service", "consultant", "local", "saas"],
    position: "body",
    slots: {
      quote: { type: "text", maxWords: 35 },
      name: { type: "text", maxWords: 4 },
      role: { type: "text", maxWords: 6 },
      image: { type: "image", ratio: "1:1", query: true },
    },
  },
  {
    id: "pricing_3tier",
    purpose: "Three pricing plans with middle highlighted",
    goodFor: ["saas", "gym", "subscription", "service"],
    position: "body",
    slots: {
      headline: { type: "text", maxWords: 6 },
      plans: { type: "list", minItems: 3, maxItems: 3 },
    },
  },
  {
    id: "faq_accordion",
    purpose: "4–8 question and answer pairs",
    goodFor: ["saas", "service", "local", "product"],
    position: "body",
    slots: {
      items: { type: "list", minItems: 4, maxItems: 8 },
    },
  },
  {
    id: "about_text",
    purpose: "Heading, two paragraphs, optional stats",
    goodFor: ["local", "consultant", "agency", "portfolio"],
    position: "body",
    slots: {
      headline: { type: "text", maxWords: 6 },
      body: { type: "text", maxWords: 80 },
      stats: { type: "list", minItems: 0, maxItems: 4 },
    },
  },
  {
    id: "contact_form",
    purpose: "Name, email, message, submit",
    goodFor: ["local", "consultant", "service", "portfolio"],
    position: "body",
    slots: {
      headline: { type: "text", maxWords: 6 },
      subhead: { type: "text", maxWords: 20 },
      submitLabel: { type: "text", maxWords: 3 },
    },
  },
  {
    id: "cta_band",
    purpose: "Full-width color band with headline and button",
    goodFor: ["saas", "local", "product", "service"],
    position: "body",
    slots: {
      headline: { type: "text", maxWords: 8 },
      ctaLabel: { type: "text", maxWords: 3 },
    },
  },
  {
    id: "blog_teasers",
    purpose: "Three article or resource teasers with title and summary",
    goodFor: ["saas", "agency", "portfolio", "content", "local"],
    position: "body",
    slots: {
      headline: { type: "text", maxWords: 6 },
      items: { type: "list", minItems: 3, maxItems: 3 },
    },
  },
  {
    id: "footer_simple",
    purpose: "Logo, three link columns, copyright",
    goodFor: ["saas", "local", "portfolio", "product", "service"],
    position: "bottom",
    slots: {
      tagline: { type: "text", maxWords: 12 },
    },
  },
];

export const SECTION_BY_ID = Object.fromEntries(
  SECTION_REGISTRY.map((s) => [s.id, s]),
) as Record<string, SectionMeta>;

export function sectionsForIntent(intent: string): SectionMeta[] {
  const tag = intent.toLowerCase();
  return SECTION_REGISTRY.filter((s) =>
    s.goodFor.some((g) => tag.includes(g) || g.includes(tag)),
  );
}
