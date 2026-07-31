/**
 * Apply search/mix results into a blueprint-shaped payload for the designer.
 */

import { normalizeStructure, validateStructure } from "@/lib/spec/validate";
import type { DesignTokens, SectionId } from "@/lib/spec/schema";
import type { SiteThemeName } from "@/lib/themes";
import type { MixedTemplate, TemplateSearchResult } from "../types";
import { mixFromBrief, mixTemplates } from "./mix";
import { searchTemplates } from "./search";

export type AppliedTemplateBlueprint = {
  industry: string;
  style: string;
  theme: SiteThemeName;
  design: DesignTokens;
  sections: SectionId[];
  toneRules: string[];
  dontRules: string[];
  headlinePatterns: string[];
  layoutRules: string[];
  confidence: TemplateSearchResult["confidence"];
  templateIds: string[];
  copyPatterns: MixedTemplate["copyPatterns"];
};

function safeSections(sections: SectionId[]): SectionId[] {
  const normalized = normalizeStructure(sections);
  const err = validateStructure(normalized);
  return err
    ? normalizeStructure([
        "hero_split",
        "features_3col",
        "about_text",
        "testimonial_single",
        "contact_form",
        "footer_simple",
      ])
    : normalized;
}

export function mixedToApplied(
  mixed: MixedTemplate,
  confidence: TemplateSearchResult["confidence"],
): AppliedTemplateBlueprint {
  return {
    industry: mixed.industry,
    style: `${mixed.style} ${mixed.category} — ${mixed.name}`,
    theme: mixed.theme,
    design: { ...mixed.designTokens },
    sections: safeSections(mixed.sections),
    toneRules: (mixed.copyPatterns.tone || []).slice(0, 8),
    dontRules: (mixed.copyPatterns.avoid || []).slice(0, 8),
    headlinePatterns: [
      ...mixed.copyPatterns.headline.slice(0, 4),
      ...mixed.copyPatterns.cta.slice(0, 2).map((c) => `CTA: ${c}`),
    ].slice(0, 6),
    layoutRules: mixed.layoutRules.slice(0, 6),
    confidence,
    templateIds: mixed.sourceIds.slice(0, 2),
    copyPatterns: mixed.copyPatterns,
  };
}

/** End-to-end: brief → search/mix → applied blueprint (no LLM). */
export function applyTemplateEngine(
  brief: string,
  options?: { templateId?: string },
): {
  blueprint: AppliedTemplateBlueprint;
  search: TemplateSearchResult;
  mixed: MixedTemplate | null;
} {
  const search = searchTemplates(brief, { limit: 5 });
  const mixed = options?.templateId
    ? mixTemplates(brief, {
        sectionsFrom: options.templateId,
        tokensFrom: options.templateId,
        copyFrom: options.templateId,
      })
    : mixFromBrief(brief);

  if (!mixed) {
    return {
      search,
      mixed: null,
      blueprint: {
        industry: "general",
        style: "Clean single-page site grounded in the brief",
        theme: "bold_startup",
        design: {},
        sections: safeSections([
          "hero_split",
          "features_3col",
          "about_text",
          "testimonial_single",
          "faq_accordion",
          "contact_form",
          "footer_simple",
        ]),
        toneRules: [
          "Use the client's real brand, offer, and location from the brief",
          "Prefer specific nouns over marketing filler",
        ],
        dontRules: [
          "No lorem ipsum or placeholder brand names",
          "No purple-glow startup clichés unless the brief asks for them",
        ],
        headlinePatterns: ["{offer} in {city}", "{brand} — {promise}"],
        layoutRules: ["Hero first, footer last", "5–8 sections total"],
        confidence: "low",
        templateIds: [],
        copyPatterns: {
          headline: ["{offer} in {city}", "{brand} — {promise}"],
          cta: ["Get started", "Contact us"],
          tone: ["Specific and grounded in the brief"],
          avoid: ["No placeholder brands"],
        },
      },
    };
  }

  return {
    search,
    mixed,
    blueprint: mixedToApplied(mixed, search.confidence),
  };
}
