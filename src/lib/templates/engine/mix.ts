/**
 * Mix templates: e.g. hotel sections + luxury (premium) tokens + cafe copy.
 */

import { getTemplateById, getTemplateLibrary } from "../library";
import type { AiTemplate, MixRequest, MixedTemplate } from "../types";
import { searchTemplates } from "./search";

function pickByIdOrFirst(
  id: string | undefined,
  fallback: AiTemplate | undefined,
): AiTemplate | undefined {
  if (id) {
    const found = getTemplateById(id);
    if (found) return found;
  }
  return fallback;
}

/**
 * Compose a mixed blueprint from up to three template sources.
 * Missing pieces fall back to the primary (sections) template.
 */
export function mixTemplates(
  brief: string,
  request: MixRequest = {},
  topK = 5,
): MixedTemplate | null {
  const search = searchTemplates(brief, { limit: topK });
  const primary = search.matches[0]?.template;
  if (!primary && !request.sectionsFrom) return null;

  const sectionsT =
    pickByIdOrFirst(request.sectionsFrom, primary) ||
    getTemplateLibrary()[0];
  if (!sectionsT) return null;

  const tokensT =
    pickByIdOrFirst(request.tokensFrom, search.matches[1]?.template) ||
    sectionsT;
  const copyT =
    pickByIdOrFirst(request.copyFrom, search.matches[2]?.template) ||
    sectionsT;

  const sourceIds = [
    ...new Set([sectionsT.id, tokensT.id, copyT.id]),
  ];
  const mixed = sourceIds.length > 1;

  return {
    id: mixed ? `mix:${sourceIds.join("+")}` : sectionsT.id,
    name: mixed
      ? `Mix · ${sectionsT.industry} layout + ${tokensT.style} tokens`
      : sectionsT.name,
    industry: sectionsT.industry,
    category: sectionsT.category,
    style: tokensT.style,
    theme: tokensT.theme,
    sections: [...sectionsT.sections],
    designTokens: { ...tokensT.designTokens },
    copyPatterns: {
      headline: [...copyT.copyPatterns.headline],
      cta: [...copyT.copyPatterns.cta],
      tone: [...(copyT.copyPatterns.tone || [])],
      avoid: [...(copyT.copyPatterns.avoid || [])],
    },
    layoutRules: [...sectionsT.layoutRules],
    sourceIds,
    mixed,
  };
}

/**
 * Heuristic mix from natural language:
 * "hotel sections with luxury look" → sections=hotel, tokens=premium style.
 */
export function mixFromBrief(brief: string): MixedTemplate | null {
  const lower = brief.toLowerCase();
  const wantsMix =
    /\b(mix|combine|with .+ (look|style|tokens|palette)|sections? from|layout from)\b/.test(
      lower,
    ) ||
    (/\bluxury\b/.test(lower) &&
      /\b(hotel|restaurant|shop|boutique)\b/.test(lower));

  if (!wantsMix) {
    const hit = searchTemplates(brief, { limit: 1 }).matches[0]?.template;
    if (!hit) return null;
    return {
      id: hit.id,
      name: hit.name,
      industry: hit.industry,
      category: hit.category,
      style: hit.style,
      theme: hit.theme,
      sections: [...hit.sections],
      designTokens: { ...hit.designTokens },
      copyPatterns: { ...hit.copyPatterns },
      layoutRules: [...hit.layoutRules],
      sourceIds: [hit.id],
      mixed: false,
    };
  }

  const sectionsSearch = searchTemplates(brief, { limit: 3 });
  const luxury = getTemplateLibrary().find(
    (t) =>
      t.style === "premium" &&
      (t.tags.some((tag) => lower.includes(tag)) ||
        t.category === sectionsSearch.matches[0]?.template.category),
  );

  return mixTemplates(brief, {
    sectionsFrom: sectionsSearch.matches[0]?.template.id,
    tokensFrom: luxury?.id,
    copyFrom: sectionsSearch.matches[0]?.template.id,
  });
}
