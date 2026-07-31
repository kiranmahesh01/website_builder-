import type { WebsiteDna } from "@/lib/dna";
import type { DesignSystem } from "@/lib/design-system";

export type DebatePersona = "designer" | "marketing" | "ux" | "developer";

export type DebateOpinion = {
  persona: DebatePersona;
  stance: string;
  recommendation: string;
};

export type DebateSummary = {
  opinions: DebateOpinion[];
  managerDecision: {
    sectionOrderHint: string[];
    ctaStrength: "soft" | "medium" | "strong";
    mobileNav: string;
    rationale: string;
  };
  source: "deterministic";
};

/**
 * Lightweight multi-agent debate: four personas + Manager decision.
 * Deterministic rules + synthesis — one structured pass, no sequential LLM calls.
 */
export function runAgentDebate(input: {
  dna: WebsiteDna;
  designSystem: DesignSystem;
  sections: string[];
  goal?: string;
}): DebateSummary {
  const goal = (input.goal || "").toLowerCase();
  const must = input.dna.bestSections
    .filter((s) => s.priority === "must")
    .map((s) => s.id);
  const high = input.dna.bestSections
    .filter((s) => s.priority === "high")
    .map((s) => s.id);

  const opinions: DebateOpinion[] = [
    {
      persona: "designer",
      stance: `Push ${input.designSystem.style} with ${input.designSystem.colors.accent} CTAs on ${input.designSystem.colors.surface} surfaces.`,
      recommendation:
        "Keep hero full-bleed; avoid card chrome in the first viewport; brand name as hero-level signal.",
    },
    {
      persona: "marketing",
      stance: `Primary conversion: ${input.dna.ctas.primary[0]}. Patterns: ${input.dna.conversionPatterns[0]}.`,
      recommendation: goal.includes("lead")
        ? "Elevate contact/form and email capture; soften shop CTAs."
        : `Lead with “${input.dna.ctas.primary[0]}” and repeat after social proof.`,
    },
    {
      persona: "ux",
      stance: "Mobile-first: one primary action in nav, scannable sections, FAQ near friction points.",
      recommendation:
        "Collapse secondary links behind menu; keep hours/location or pricing reachable within two scrolls.",
    },
    {
      persona: "developer",
      stance: "Prefer 6–7 typed sections; skip optional blocks that bloat HTML and hurt performance score.",
      recommendation: `Ship must sections (${must.slice(0, 4).join(", ")}) first; defer optional DNA extras.`,
    },
  ];

  // Manager synthesizes: order = hero → must body → proof → CTA → footer
  const ordered = prioritizeSections(input.sections, must, high);
  const ctaStrength =
    input.dna.ctas.strength === "strong" || /book|buy|demo|trial|order/.test(goal)
      ? "strong"
      : input.dna.ctas.strength;

  return {
    opinions,
    managerDecision: {
      sectionOrderHint: ordered,
      ctaStrength,
      mobileNav: `Brand + “${input.dna.ctas.primary[0]}” CTA; remaining links in overflow menu.`,
      rationale: `Manager weighed Designer atmosphere, Marketing CTA “${input.dna.ctas.primary[0]}”, UX mobile nav, and Developer section budget for ${input.dna.industry}.`,
    },
    source: "deterministic",
  };
}

function prioritizeSections(
  sections: string[],
  must: string[],
  high: string[],
): string[] {
  const score = (id: string) => {
    if (id.startsWith("hero_")) return 100;
    if (id.startsWith("footer_")) return 0;
    if (must.includes(id)) return 80;
    if (high.includes(id)) return 60;
    if (/testimonial|pricing|cta/.test(id)) return 50;
    return 40;
  };
  return [...sections].sort((a, b) => score(b) - score(a));
}
