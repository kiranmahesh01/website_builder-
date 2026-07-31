/**
 * AI-ready structured templates — section IDs + design tokens + copy patterns.
 * Not React page implementations; Magic AI renders via SiteSpec sections.
 */

import type { DesignTokens, SectionId } from "@/lib/spec/schema";
import type { SiteThemeName } from "@/lib/themes";

export const TEMPLATE_CATEGORIES = [
  "landing",
  "saas",
  "restaurant",
  "portfolio",
  "ecommerce",
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const TEMPLATE_STYLES = [
  "premium",
  "minimal",
  "bold",
  "warm",
  "playful",
  "editorial",
  "modern",
  "classic",
] as const;

export type TemplateStyle = (typeof TEMPLATE_STYLES)[number];

export type CopyPatterns = {
  headline: string[];
  cta: string[];
  tone?: string[];
  avoid?: string[];
};

export type AiTemplate = {
  id: string;
  name: string;
  industry: string;
  category: TemplateCategory;
  style: TemplateStyle;
  theme: SiteThemeName;
  sections: SectionId[];
  designTokens: DesignTokens;
  copyPatterns: CopyPatterns;
  tags: string[];
  layoutRules: string[];
};

export type TemplateMatch = {
  template: AiTemplate;
  score: number;
  matchedTags: string[];
};

export type TemplateSearchResult = {
  matches: TemplateMatch[];
  industry: string;
  category: TemplateCategory | "general";
  confidence: "high" | "medium" | "low";
};

export type MixRequest = {
  /** Prefer sections from this template id (or first search hit). */
  sectionsFrom?: string;
  /** Prefer design tokens from this template id. */
  tokensFrom?: string;
  /** Prefer copy patterns from this template id. */
  copyFrom?: string;
};

export type MixedTemplate = {
  id: string;
  name: string;
  industry: string;
  category: TemplateCategory | "general";
  style: TemplateStyle | string;
  theme: SiteThemeName;
  sections: SectionId[];
  designTokens: DesignTokens;
  copyPatterns: CopyPatterns;
  layoutRules: string[];
  sourceIds: string[];
  mixed: boolean;
};
