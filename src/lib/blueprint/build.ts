import { buildBrandKit } from "@/lib/create/brand-kit";
import {
  EMPTY_CREATE_ANSWERS,
  suggestedPages,
  type CreateWizardAnswers,
  type WebsiteTypeId,
} from "@/lib/create/brief";
import { generateDesignSystem } from "@/lib/design-system";
import { matchWebsiteDna } from "@/lib/dna";
import { expandPromptToExpertBrief } from "@/lib/prompt";
import { buildWebsitePlan } from "@/lib/create/plan";
import { runAgentDebate } from "./debate";
import type { MagicBlueprint } from "./types";

function answersFromBrief(
  brief: string,
  websiteType?: string,
): CreateWizardAnswers {
  const get = (label: string) => {
    const re = new RegExp(`^\\s*${label}:\\s*(.+)$`, "im");
    return brief.match(re)?.[1]?.trim() || "";
  };
  const styleRaw = get("Style").toLowerCase();
  const style = (
    ["luxury", "bold", "corporate", "modern", "minimal"] as const
  ).find((s) => styleRaw.includes(s)) || "minimal";

  return {
    ...EMPTY_CREATE_ANSWERS,
    websiteType: (websiteType as WebsiteTypeId) || "business",
    industry: get("Industry") || "General",
    industryCustom: get("Industry") || "",
    style,
    businessName: get("Business"),
    goal: get("Goal"),
    targetCustomers: get("Target"),
    brandFeeling: get("Brand feeling"),
    colors: get("Colors"),
    extraDetails: get("Extra details") || get("Idea") || "",
  };
}

function liftForPriority(priority: "must" | "high" | "optional"): string {
  if (priority === "must") return "High — core path to the primary conversion.";
  if (priority === "high") return "Medium — strengthens trust or offer clarity.";
  return "Supporting — use if space and performance budget allow.";
}

/**
 * Build the Magic AI Blueprint — strategist deliverable before generate.
 */
export function buildMagicBlueprint(input: {
  brief: string;
  websiteType?: WebsiteTypeId | string;
  templateId?: string | null;
  browseCategory?: string | null;
}): MagicBlueprint & {
  planPreview: ReturnType<typeof buildWebsitePlan>;
} {
  const brief = input.brief.trim();
  const answers = answersFromBrief(brief, input.websiteType);
  const industry = answers.industry || answers.industryCustom;
  const dnaMatch = matchWebsiteDna(brief, industry);
  const dna = dnaMatch.dna;

  const expanded = expandPromptToExpertBrief({
    idea: brief,
    industryHint: industry,
    businessName: answers.businessName,
    goal: answers.goal,
    audience: answers.targetCustomers,
    style: answers.style,
    extras: answers.extraDetails,
    dna,
  });

  const planPreview = buildWebsitePlan({
    brief,
    websiteType: input.websiteType,
    templateId: input.templateId,
    browseCategory: input.browseCategory,
  });

  const brandKit = planPreview.brandKit || buildBrandKit(answers);
  const designPlan = generateDesignSystem({
    dna,
    style: answers.style,
    brandKit,
    businessName: answers.businessName || brandKit.businessName,
  });

  // Merge DNA section recommendations with template/plan sections.
  const structureMap = new Map<
    string,
    { id: string; label: string; why: string; priority: "must" | "high" | "optional" }
  >();
  for (const s of dna.bestSections) {
    structureMap.set(s.id, s);
  }
  for (const id of planPreview.sections) {
    if (!structureMap.has(id)) {
      structureMap.set(id, {
        id,
        label: id.replace(/_/g, " "),
        why: "Selected from matched template / plan for this brief.",
        priority: "high",
      });
    }
  }

  const websiteStructure = [...structureMap.values()].map((s) => ({
    ...s,
    expectedLift: liftForPriority(s.priority),
  }));

  // Apply debate ordering.
  const debate = runAgentDebate({
    dna,
    designSystem: designPlan,
    sections: websiteStructure.map((s) => s.id),
    goal: answers.goal,
  });
  const order = new Map(
    debate.managerDecision.sectionOrderHint.map((id, i) => [id, i]),
  );
  websiteStructure.sort(
    (a, b) => (order.get(a.id) ?? 50) - (order.get(b.id) ?? 50),
  );

  const conversionImprovements = [
    ...dna.conversionPatterns.map((p, i) => ({
      title: p,
      why: dna.strategyTips[i] || dna.bestSections[i]?.why || "Aligned to industry conversion DNA.",
      relatedSection: dna.bestSections[i]?.id,
    })),
    {
      title: `CTA strength → ${debate.managerDecision.ctaStrength}`,
      why: debate.managerDecision.rationale,
    },
    {
      title: "Mobile nav focused on primary action",
      why: debate.managerDecision.mobileNav,
    },
  ];

  const typeId = (input.websiteType || "business") as WebsiteTypeId;
  const pages = suggestedPages(
    ["business", "portfolio", "store", "blog", "landing"].includes(typeId)
      ? typeId
      : "business",
  );

  const modelHints = dna.discoveryQuestions.map((q) => q.prompt);
  const title = `${answers.businessName || brandKit.businessName || dna.industry} — Magic Blueprint`;

  const blueprint: MagicBlueprint = {
    version: 1,
    title,
    summary: `${planPreview.summary} Magic Blueprint matches ${dna.industry} DNA (${dnaMatch.confidence} confidence) and locks a design system before build.`,
    businessAnalysis: {
      industry: dna.industry,
      businessModelHints: modelHints,
      positioning: `Position as ${dna.psychology.tone.slice(0, 2).join(" + ")} for people who want ${dna.psychology.desires[0]}.`,
      risks: dna.psychology.fears.map((f) => `Visitors fear: ${f}`),
      opportunities: dna.strategyTips,
    },
    customerStrategy: {
      primaryAudience:
        answers.targetCustomers ||
        `People seeking ${dna.psychology.desires.join(", ")}`,
      desires: dna.psychology.desires,
      fears: dna.psychology.fears,
      decisionTriggers: dna.psychology.decisionTriggers,
      messagingPillars: [
        ...dna.psychology.tone.slice(0, 2),
        dna.ctas.primary[0] || "Clear next step",
      ],
      recommendedOffers: dna.ctas.primary,
    },
    websiteStructure,
    designPlan,
    conversionImprovements,
    strategyRecommendations: dna.strategyTips,
    debate,
    dna: {
      id: dna.id,
      industry: dna.industry,
      confidence: dnaMatch.confidence,
      matchedAliases: dnaMatch.matchedAliases,
    },
    expandedBrief: expanded.expandedBrief,
    pages,
    templateHints: planPreview.templates.slice(0, 3).map((t) => t.id),
  };

  return { ...blueprint, planPreview };
}
