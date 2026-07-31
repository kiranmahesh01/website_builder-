/**
 * Code-first website template knowledge base (no vector DB for v1).
 * Templates feed the planner/designer so common industries skip extra LLM calls.
 */

import type { DesignTokens, SectionId } from "@/lib/spec/schema";
import type { SiteThemeName } from "@/lib/themes";

export type IndustryTemplate = {
  id: string;
  industry: string;
  /** Keywords / synonyms used by the retriever. */
  keywords: string[];
  style: string;
  theme: SiteThemeName;
  design: DesignTokens;
  sections: SectionId[];
  toneRules: string[];
  dontRules: string[];
  headlinePatterns: string[];
  /** Short layout / composition rules for the designer. */
  layoutRules: string[];
};

export type TemplateMatch = {
  template: IndustryTemplate;
  score: number;
  matchedKeywords: string[];
};

export type RetrievedTemplates = {
  matches: TemplateMatch[];
  /** Best industry guess, or "general" when nothing scored well. */
  industry: string;
  confidence: "high" | "medium" | "low";
};
