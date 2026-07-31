/**
 * Designer agent — emits a Website Blueprint before content generation.
 *
 * Prefer the deterministic KB path for common industries (protects the ~50s
 * budget). Only call the model when retrieval confidence is low.
 */

import { z } from "zod";
import {
  formatTemplatesForPrompt,
  retrieveTemplates,
  type RetrievedTemplates,
} from "@/lib/knowledge";
import { applyTemplateEngine } from "@/lib/templates";
import {
  DesignTokensSchema,
  SectionIdSchema,
  SiteThemeSchema,
  type DesignTokens,
  type SectionId,
} from "@/lib/spec/schema";
import { normalizeStructure, validateStructure } from "@/lib/spec/validate";
import { pickThemeFromBrief, type SiteThemeName } from "@/lib/themes";
import { agentJson, isOffline, type AgentLlmContext } from "./llm";

export const WebsiteBlueprintSchema = z.object({
  industry: z.string().min(1).max(64),
  style: z.string().min(1).max(240),
  theme: SiteThemeSchema,
  design: DesignTokensSchema,
  sections: z.array(SectionIdSchema).min(5).max(8),
  toneRules: z.array(z.string().min(1).max(200)).max(8),
  dontRules: z.array(z.string().min(1).max(200)).max(8),
  headlinePatterns: z.array(z.string().min(1).max(120)).max(6),
  layoutRules: z.array(z.string().min(1).max(200)).max(6),
  confidence: z.enum(["high", "medium", "low"]),
  source: z.enum(["deterministic", "llm"]),
  templateIds: z.array(z.string()).max(2),
});

export type WebsiteBlueprint = z.infer<typeof WebsiteBlueprintSchema>;

const LlmBlueprintSchema = z.object({
  industry: z.string().min(1).max(64).default("general"),
  style: z.string().min(1).max(240),
  theme: SiteThemeSchema,
  design: DesignTokensSchema.default({}),
  sections: z.array(SectionIdSchema).min(5).max(8),
  toneRules: z.array(z.string()).max(8).default([]),
  dontRules: z.array(z.string()).max(8).default([]),
  headlinePatterns: z.array(z.string()).max(6).default([]),
  layoutRules: z.array(z.string()).max(6).default([]),
});

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

/** Deterministic blueprint from the AI Template Engine (search → mix → apply). */
export function blueprintFromTemplates(
  brief: string,
  retrieved: RetrievedTemplates = retrieveTemplates(brief),
  options?: { templateId?: string },
): WebsiteBlueprint {
  const pinnedId =
    options?.templateId || retrieved.matches[0]?.template.id || undefined;
  const applied = applyTemplateEngine(brief, {
    templateId: pinnedId,
  });
  const bp = applied.blueprint;

  // Blend a second KB hit's tone tips when scores are close.
  const second = retrieved.matches[1]?.template;
  const toneRules = [...bp.toneRules];
  const dontRules = [...bp.dontRules];
  if (
    second &&
    retrieved.matches[0] &&
    retrieved.matches[1]!.score >= retrieved.matches[0]!.score - 1
  ) {
    for (const rule of second.toneRules.slice(0, 2)) {
      if (!toneRules.includes(rule)) toneRules.push(rule);
    }
  }

  const theme: SiteThemeName =
    bp.theme || retrieved.matches[0]?.template.theme || pickThemeFromBrief(brief);

  return {
    industry: bp.industry || retrieved.industry || "general",
    style: bp.style,
    theme,
    design: { ...bp.design },
    sections: safeSections(bp.sections),
    toneRules: toneRules.slice(0, 8),
    dontRules: dontRules.slice(0, 8),
    headlinePatterns: bp.headlinePatterns.slice(0, 6),
    layoutRules: bp.layoutRules.slice(0, 6),
    confidence: retrieved.confidence !== "low" ? retrieved.confidence : bp.confidence,
    source: "deterministic",
    templateIds: pinnedId
      ? [pinnedId, ...retrieved.matches.map((m) => m.template.id).filter((id) => id !== pinnedId)].slice(0, 2)
      : bp.templateIds.length > 0
        ? bp.templateIds
        : retrieved.matches.map((m) => m.template.id),
  };
}

function designerSystemPrompt(retrieved: RetrievedTemplates): string {
  return `You are the DESIGNER agent for Magic AI. Output STRICT JSON only.

Produce a Website Blueprint BEFORE copy is written. Do not write page copy.

Industry templates (use as strong priors):
${formatTemplatesForPrompt(retrieved)}

Output shape:
{
  "industry": "string",
  "style": "one sentence visual direction",
  "theme": "bold_startup" | "warm_editorial" | "minimal_studio",
  "design": { "accent": "#RRGGBB", "buttonBg": "#RRGGBB", "displayFont": "Manrope", "bodyFont": "Inter", "radius": "small|medium|large|none" },
  "sections": ["hero_split", "...", "footer_simple"],
  "toneRules": ["..."],
  "dontRules": ["..."],
  "headlinePatterns": ["..."],
  "layoutRules": ["..."]
}

Rules:
- Exactly 5–8 sections. First must be hero_centered or hero_split. Last must be footer_simple.
- Colours MUST be hex (#RRGGBB). Fonts must be one of: Archivo, Inter, Instrument Serif, Manrope, Playfair Display, DM Sans, Space Grotesk.
- Prefer the highest-scoring template's section sequence unless the brief clearly conflicts.
- Return ONLY valid JSON.`;
}

function mergeLlmBlueprint(
  brief: string,
  retrieved: RetrievedTemplates,
  raw: z.infer<typeof LlmBlueprintSchema>,
): WebsiteBlueprint {
  const fallback = blueprintFromTemplates(brief, retrieved);
  return {
    industry: raw.industry || fallback.industry,
    style: raw.style || fallback.style,
    theme: raw.theme || fallback.theme,
    design: { ...fallback.design, ...raw.design } as DesignTokens,
    sections: safeSections(raw.sections),
    toneRules:
      raw.toneRules.length > 0 ? raw.toneRules.slice(0, 8) : fallback.toneRules,
    dontRules:
      raw.dontRules.length > 0 ? raw.dontRules.slice(0, 8) : fallback.dontRules,
    headlinePatterns:
      raw.headlinePatterns.length > 0
        ? raw.headlinePatterns.slice(0, 6)
        : fallback.headlinePatterns,
    layoutRules:
      raw.layoutRules.length > 0
        ? raw.layoutRules.slice(0, 6)
        : fallback.layoutRules,
    confidence: "medium",
    source: "llm",
    templateIds: retrieved.matches.map((m) => m.template.id),
  };
}

export async function runDesigner(input: {
  brief: string;
  retrieved?: RetrievedTemplates;
  ctx: AgentLlmContext;
  /** Force deterministic even when confidence is low (budget protection). */
  forceDeterministic?: boolean;
  /** Pin a user-selected template from the create wizard. */
  templateId?: string;
}): Promise<WebsiteBlueprint> {
  const retrieved =
    input.retrieved ??
    retrieveTemplates(input.brief, 2, { templateId: input.templateId });
  const deterministic = blueprintFromTemplates(input.brief, retrieved, {
    templateId: input.templateId,
  });

  // Common path: KB hit is good enough — skip the model call.
  if (
    input.forceDeterministic ||
    retrieved.confidence === "high" ||
    retrieved.confidence === "medium" ||
    isOffline(input.ctx)
  ) {
    return deterministic;
  }

  const json = await agentJson(
    input.ctx,
    [
      { role: "system", content: designerSystemPrompt(retrieved) },
      { role: "user", content: `Business brief:\n${input.brief}` },
    ],
    900,
  );

  const parsed = json ? LlmBlueprintSchema.safeParse(json) : null;
  if (!parsed?.success) return deterministic;

  return mergeLlmBlueprint(input.brief, retrieved, parsed.data);
}

/** Compact digest for developer / content prompts (includes copyPatterns). */
export function blueprintDigest(blueprint: WebsiteBlueprint): string {
  return [
    `Industry: ${blueprint.industry}`,
    `Style: ${blueprint.style}`,
    `Theme: ${blueprint.theme}`,
    `Sections: ${blueprint.sections.join(" → ")}`,
    `Tone: ${blueprint.toneRules.join("; ")}`,
    `Avoid: ${blueprint.dontRules.join("; ")}`,
    `Copy patterns / headlines: ${blueprint.headlinePatterns.join(" | ")}`,
    `Layout: ${blueprint.layoutRules.join("; ")}`,
    blueprint.templateIds.length
      ? `Template ids: ${blueprint.templateIds.join(", ")}`
      : null,
    blueprint.design && Object.keys(blueprint.design).length > 0
      ? `Design tokens: ${JSON.stringify(blueprint.design)}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}
