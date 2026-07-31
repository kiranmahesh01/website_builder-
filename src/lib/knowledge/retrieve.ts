/**
 * Lightweight template retriever — delegates to the AI Template Engine
 * (no embeddings, no sequential model calls).
 */

import { searchTemplates, type AiTemplate } from "@/lib/templates";
import type { IndustryTemplate, RetrievedTemplates, TemplateMatch } from "./types";

function toIndustryTemplate(t: AiTemplate): IndustryTemplate {
  return {
    id: t.id,
    industry: t.industry,
    keywords: t.tags,
    style: `${t.style} · ${t.category}`,
    theme: t.theme,
    design: t.designTokens,
    sections: t.sections,
    toneRules: t.copyPatterns.tone || [],
    dontRules: t.copyPatterns.avoid || [],
    headlinePatterns: [
      ...t.copyPatterns.headline,
      ...t.copyPatterns.cta.map((c) => `CTA: ${c}`),
    ].slice(0, 6),
    layoutRules: t.layoutRules,
  };
}

export function retrieveTemplates(
  brief: string,
  limit = 2,
): RetrievedTemplates {
  const result = searchTemplates(brief, { limit });
  const matches: TemplateMatch[] = result.matches.map((m) => ({
    template: toIndustryTemplate(m.template),
    score: m.score,
    matchedKeywords: m.matchedTags,
  }));

  return {
    matches,
    industry: result.industry,
    confidence: result.confidence,
  };
}

/** Compact block injected into planner/designer prompts. */
export function formatTemplatesForPrompt(retrieved: RetrievedTemplates): string {
  if (retrieved.matches.length === 0) {
    return "No industry template matched. Infer structure carefully from the brief.";
  }

  return retrieved.matches
    .map((match, i) => {
      const t = match.template;
      return [
        `Template ${i + 1}: ${t.id} (score ${match.score}, keywords: ${match.matchedKeywords.slice(0, 8).join(", ") || "—"})`,
        `  style: ${t.style}`,
        `  theme: ${t.theme}`,
        `  sections: ${t.sections.join(" → ")}`,
        `  tone: ${t.toneRules.join("; ")}`,
        `  avoid: ${t.dontRules.join("; ")}`,
        `  headlines: ${t.headlinePatterns.join(" | ")}`,
      ].join("\n");
    })
    .join("\n\n");
}
