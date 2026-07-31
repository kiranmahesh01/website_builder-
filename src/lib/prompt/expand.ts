import type { WebsiteDna } from "@/lib/dna";
import { matchWebsiteDna } from "@/lib/dna";

/**
 * Prompt Optimization Engine — expand a short user idea into an expert brief
 * using Website DNA + conversion strategy. Used wherever generate starts.
 */
export function expandPromptToExpertBrief(input: {
  idea: string;
  industryHint?: string;
  businessName?: string;
  goal?: string;
  audience?: string;
  style?: string;
  extras?: string;
  dna?: WebsiteDna;
}): { expandedBrief: string; dna: WebsiteDna; confidence: string } {
  const idea = input.idea.trim();
  const match = input.dna
    ? {
        dna: input.dna,
        confidence: "high" as const,
        matchedAliases: [],
        score: 10,
      }
    : matchWebsiteDna(idea, input.industryHint);
  const dna = match.dna;

  const name =
    input.businessName?.trim() ||
    extractName(idea) ||
    `${dna.industry} Studio`;
  const goal =
    input.goal?.trim() ||
    dna.ctas.primary[0] ||
    "Convert visitors into customers";
  const audience =
    input.audience?.trim() ||
    dna.psychology.desires.slice(0, 2).join(" seekers · ") ||
    "target customers";

  const sections = dna.bestSections
    .filter((s) => s.priority !== "optional")
    .map((s) => `${s.label} (${s.why})`)
    .slice(0, 6);

  const expandedBrief = [
    `Business: ${name}`,
    `Industry: ${dna.industry}`,
    `Idea: ${idea}`,
    `Goal: ${goal}`,
    `Target: ${audience}`,
    input.style ? `Style: ${input.style}` : null,
    `Brand feeling: ${dna.psychology.tone.join(", ")}`,
    `Customer desires: ${dna.psychology.desires.join("; ")}`,
    `Decision triggers: ${dna.psychology.decisionTriggers.join("; ")}`,
    `Avoid fears in copy: ${dna.psychology.fears.join("; ")}`,
    `Primary CTAs: ${dna.ctas.primary.join(" / ")}`,
    `Trust elements: ${dna.trustElements.join("; ")}`,
    `Conversion patterns: ${dna.conversionPatterns.join("; ")}`,
    `Recommended sections: ${sections.join(" · ")}`,
    `Strategy: ${dna.strategyTips[0] || "Lead with one clear conversion action."}`,
    input.extras?.trim() ? `Extra details: ${input.extras.trim()}` : null,
    "Instruction: Write specific, local, non-generic copy. No lorem ipsum. One primary CTA strength throughout.",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    expandedBrief,
    dna,
    confidence: match.confidence,
  };
}

function extractName(idea: string): string | null {
  // "Northbeam Coffee — ..." or "Acme: analytics for..."
  const m =
    idea.match(/^([A-Z][\w'&]+(?:\s+[A-Z][\w'&]+){0,3})\s*[—\-:]/) ||
    idea.match(/^([A-Z][\w'&]+(?:\s+[A-Z][\w'&]+)+)\s+is\b/);
  return m?.[1]?.trim() || null;
}
