/**
 * Lightweight AI Website Plan — deterministic KB + template engine + designer.
 * No full site generation, no heavy content LLM.
 */

import { blueprintFromTemplates, type WebsiteBlueprint } from "@/lib/agents/designer";
import { planFromBrief } from "@/lib/agents/planner";
import type { AgentPlan } from "@/lib/agents/types";
import { retrieveTemplates } from "@/lib/knowledge";
import {
  TEMPLATE_CATEGORIES,
  getTemplateById,
  getTemplateLibrary,
  searchTemplates,
  type AiTemplate,
  type TemplateCategory,
} from "@/lib/templates";
import { buildBrandKit, type BrandKit } from "./brand-kit";
import {
  EMPTY_CREATE_ANSWERS,
  suggestedPages,
  type CreateWizardAnswers,
  type WebsiteTypeId,
} from "./brief";
import { enrichBriefForSearch, mapIndustryToTemplate } from "./industry";

export type PlanTemplateCard = {
  id: string;
  name: string;
  industry: string;
  style: string;
  category: string;
  score: number;
  why: string;
  sections: string[];
};

export type WebsitePlanPreview = {
  industry: string;
  websiteType: string;
  pages: string[];
  design: {
    style: string;
    theme: string;
    tokens: Record<string, string>;
    confidence: WebsiteBlueprint["confidence"];
  };
  sections: string[];
  components: string[];
  summary: string;
  steps: string[];
  designScorePreview: number;
  templates: PlanTemplateCard[];
  browseTemplates: PlanTemplateCard[];
  categories: TemplateCategory[];
  brandKit: BrandKit;
  plan: AgentPlan;
  blueprint: WebsiteBlueprint;
};

/** Map create website types → template categories for browsing. */
export const BROWSE_CATEGORY_GROUPS: {
  id: string;
  label: string;
  categories: TemplateCategory[];
}[] = [
  { id: "business", label: "Business", categories: ["landing", "restaurant"] },
  { id: "store", label: "Store", categories: ["ecommerce"] },
  { id: "professional", label: "Professional", categories: ["portfolio"] },
  { id: "technology", label: "Technology", categories: ["saas"] },
];

function whyMatched(template: AiTemplate, matchedTags: string[], score: number): string {
  const tags = matchedTags.slice(0, 4).join(", ");
  if (tags) {
    return `Matched ${template.industry} · ${template.style} via ${tags} (score ${score})`;
  }
  return `Strong ${template.industry} / ${template.style} fit for this brief`;
}

function previewDesignScore(blueprint: WebsiteBlueprint): number {
  let score = 70;
  if (blueprint.sections.length >= 6) score += 6;
  if (blueprint.sections.length >= 7) score += 2;
  if (Object.keys(blueprint.design || {}).length >= 3) score += 8;
  else if (Object.keys(blueprint.design || {}).length >= 1) score += 3;
  if (blueprint.confidence === "high") score += 8;
  else if (blueprint.confidence === "medium") score += 4;
  if (blueprint.toneRules.length >= 2) score += 2;
  if (blueprint.templateIds.length > 0) score += 2;
  return Math.min(94, Math.max(55, score));
}

function tokenRecord(design: WebsiteBlueprint["design"]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(design || {})) {
    if (typeof value === "string" && value.trim()) out[key] = value;
  }
  return out;
}

function industryFromBrief(brief: string): string | undefined {
  const match = brief.match(/^\s*Industry:\s*(.+)$/im);
  return match?.[1]?.trim();
}

function answersFromBrief(
  brief: string,
  websiteType?: string,
): CreateWizardAnswers {
  const get = (label: string) => {
    const re = new RegExp(`^\\s*${label}:\\s*(.+)$`, "im");
    return brief.match(re)?.[1]?.trim() || "";
  };
  return {
    ...EMPTY_CREATE_ANSWERS,
    websiteType: (websiteType as WebsiteTypeId) || "business",
    industry: get("Industry") || "General",
    industryCustom: get("Industry") || "",
    style: (() => {
      const s = get("Style").toLowerCase();
      if (s.includes("luxury")) return "luxury";
      if (s.includes("bold")) return "bold";
      if (s.includes("corporate")) return "corporate";
      if (s.includes("modern")) return "modern";
      return "minimal";
    })(),
    businessName: get("Business"),
    goal: get("Goal"),
    targetCustomers: get("Target"),
    brandFeeling: get("Brand feeling"),
    colors: get("Colors"),
    extraDetails: get("Extra details"),
  };
}

export function buildWebsitePlan(input: {
  brief: string;
  websiteType?: WebsiteTypeId | string;
  templateId?: string | null;
  templateLimit?: number;
  browseCategory?: string | null;
}): WebsitePlanPreview {
  const brief = input.brief.trim();
  const limit = input.templateLimit ?? 4;
  const industryLabel = industryFromBrief(brief);
  const searchBrief = enrichBriefForSearch(brief, industryLabel);
  const mappedIndustry = industryLabel
    ? mapIndustryToTemplate(industryLabel)
    : undefined;

  // Prefer industry-filtered search when we have a strong mapping; fall back.
  let search = mappedIndustry
    ? searchTemplates(searchBrief, { limit, industry: mappedIndustry })
    : searchTemplates(searchBrief, { limit });
  if (search.matches.length === 0) {
    search = searchTemplates(searchBrief, { limit });
  }

  const templates: PlanTemplateCard[] = search.matches.map((m) => ({
    id: m.template.id,
    name: m.template.name,
    industry: m.template.industry,
    style: m.template.style,
    category: m.template.category,
    score: m.score,
    why: whyMatched(m.template, m.matchedTags, m.score),
    sections: m.template.sections,
  }));

  // Prefer user pick in the card list (move to front if present).
  if (input.templateId) {
    const pinned = getTemplateById(input.templateId);
    if (pinned && !templates.some((t) => t.id === pinned.id)) {
      templates.unshift({
        id: pinned.id,
        name: pinned.name,
        industry: pinned.industry,
        style: pinned.style,
        category: pinned.category,
        score: 100,
        why: "Selected by you for this build",
        sections: pinned.sections,
      });
    } else if (pinned) {
      const idx = templates.findIndex((t) => t.id === pinned.id);
      if (idx > 0) {
        const [card] = templates.splice(idx, 1);
        templates.unshift({ ...card!, why: "Selected by you for this build" });
      }
    }
  }

  const preferredTemplateId =
    input.templateId || templates[0]?.id || undefined;
  const retrieved = retrieveTemplates(searchBrief, 2, {
    templateId: preferredTemplateId,
  });
  const plan = planFromBrief(brief, retrieved);
  const blueprint = blueprintFromTemplates(searchBrief, retrieved, {
    templateId: preferredTemplateId,
  });

  const typeId = (input.websiteType || "business") as WebsiteTypeId;
  const pages = suggestedPages(
    ["business", "portfolio", "store", "blog", "landing"].includes(typeId)
      ? typeId
      : "business",
  );

  const group = BROWSE_CATEGORY_GROUPS.find((g) => g.id === input.browseCategory);
  const browsePool = getTemplateLibrary().filter((t) =>
    group ? group.categories.includes(t.category) : true,
  );
  const browseTemplates: PlanTemplateCard[] = browsePool
    .slice(0, 12)
    .map((t) => ({
      id: t.id,
      name: t.name,
      industry: t.industry,
      style: t.style,
      category: t.category,
      score: 0,
      why: `${t.category} · ${t.style}`,
      sections: t.sections,
    }));

  const tokens = tokenRecord(blueprint.design);
  const brandKit = buildBrandKit(answersFromBrief(brief, String(typeId)), {
    tokens,
    displayFont: tokens.displayFont,
    bodyFont: tokens.bodyFont,
  });

  return {
    industry: blueprint.industry,
    websiteType: String(input.websiteType || "business"),
    pages,
    design: {
      style: blueprint.style,
      theme: blueprint.theme,
      tokens,
      confidence: blueprint.confidence,
    },
    sections: blueprint.sections,
    components: blueprint.sections.map((s) => s.replace(/_/g, " ")),
    summary: plan.summary,
    steps: plan.steps,
    designScorePreview: previewDesignScore(blueprint),
    templates: templates.slice(0, limit),
    browseTemplates,
    categories: [...TEMPLATE_CATEGORIES],
    brandKit,
    plan,
    blueprint,
  };
}
