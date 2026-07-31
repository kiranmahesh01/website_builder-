/**
 * Deterministic template search — keyword / tag scoring, no embeddings.
 * Fast enough for the ~50s generation budget (no model calls).
 */

import { getTemplateLibrary } from "../library";
import type {
  AiTemplate,
  TemplateMatch,
  TemplateSearchResult,
} from "../types";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function scoreTemplate(
  briefTokens: Set<string>,
  briefLower: string,
  template: AiTemplate,
): TemplateMatch {
  const matchedTags: string[] = [];
  let score = 0;

  const haystack = [
    template.industry,
    template.category,
    template.style,
    template.theme,
    template.name,
    ...template.tags,
  ];

  for (const tag of haystack) {
    const phrase = tag.toLowerCase();
    const parts = phrase.split(/\s+/);

    if (phrase.includes(" ") && briefLower.includes(phrase)) {
      score += 4;
      if (!matchedTags.includes(tag)) matchedTags.push(tag);
      continue;
    }

    if (briefTokens.has(phrase) || parts.every((p) => briefTokens.has(p))) {
      score += phrase.length > 6 ? 3 : 2;
      if (!matchedTags.includes(tag)) matchedTags.push(tag);
      continue;
    }

    for (const token of briefTokens) {
      if (
        token.length >= 4 &&
        phrase.length >= 4 &&
        (token.startsWith(phrase.slice(0, 5)) ||
          phrase.startsWith(token.slice(0, 5)))
      ) {
        score += 1;
        if (!matchedTags.includes(tag)) matchedTags.push(tag);
        break;
      }
    }
  }

  // Soft boosts for style / theme words in the brief
  if (briefLower.includes(template.style)) score += 2;
  if (briefLower.includes(template.theme.replace(/_/g, " "))) score += 2;
  if (briefLower.includes("luxury") && template.style === "premium") score += 2;
  if (briefLower.includes("minimal") && template.style === "minimal") score += 2;

  return { template, score, matchedTags };
}

export function searchTemplates(
  brief: string,
  options: {
    limit?: number;
    category?: AiTemplate["category"];
    industry?: string;
    style?: string;
  } = {},
): TemplateSearchResult {
  const limit = options.limit ?? 5;
  const briefLower = brief.toLowerCase();
  const briefTokens = new Set(tokenize(brief));
  const library = getTemplateLibrary();

  let pool = library;
  if (options.category) {
    pool = pool.filter((t) => t.category === options.category);
  }
  if (options.industry) {
    const ind = options.industry.toLowerCase();
    pool = pool.filter((t) => t.industry === ind);
  }
  if (options.style) {
    const style = options.style.toLowerCase();
    pool = pool.filter((t) => t.style === style);
  }

  const scored = pool
    .map((template) => scoreTemplate(briefTokens, briefLower, template))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  const matches = scored.slice(0, limit);
  const top = matches[0];

  let confidence: TemplateSearchResult["confidence"] = "low";
  if (top && top.score >= 8 && top.matchedTags.length >= 2) {
    confidence = "high";
  } else if (top && top.score >= 4) {
    confidence = "medium";
  }

  return {
    matches,
    industry: top?.template.industry ?? "general",
    category: top?.template.category ?? "general",
    confidence,
  };
}

/** Compact block for planner / designer / content prompts. */
export function formatTemplateMatchesForPrompt(
  result: TemplateSearchResult,
): string {
  if (result.matches.length === 0) {
    return "No AI template matched. Infer structure carefully from the brief.";
  }

  return result.matches
    .map((match, i) => {
      const t = match.template;
      return [
        `Template ${i + 1}: ${t.id} (${t.category}/${t.style}, score ${match.score})`,
        `  tags: ${match.matchedTags.slice(0, 8).join(", ") || "—"}`,
        `  theme: ${t.theme}`,
        `  sections: ${t.sections.join(" → ")}`,
        `  headlines: ${t.copyPatterns.headline.join(" | ")}`,
        `  CTAs: ${t.copyPatterns.cta.join(" | ")}`,
        `  tone: ${(t.copyPatterns.tone || []).join("; ")}`,
        `  avoid: ${(t.copyPatterns.avoid || []).join("; ")}`,
      ].join("\n");
    })
    .join("\n\n");
}

export function countTemplatesByCategory(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const t of getTemplateLibrary()) {
    counts[t.category] = (counts[t.category] || 0) + 1;
  }
  counts.total = getTemplateLibrary().length;
  return counts;
}
