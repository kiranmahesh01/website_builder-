import type { SiteSpec } from "@/lib/spec/schema";
import type { ValidationIssue } from "@/lib/agents/types";
import { matchWebsiteDna } from "@/lib/dna";

/** Magic Score — multi-dimension quality branded for publish gate + Auto fix. */
export type MagicScore = {
  design: number;
  ux: number;
  seo: number;
  performance: number;
  conversion: number;
  accessibility: number;
  overall: number;
  /** Back-compat with DesignCritic / QualityScores */
  mobile: number;
};

export type MagicScoreReport = {
  scores: MagicScore;
  label: "Magic Score";
  passed: boolean;
  notes: string[];
};

/**
 * Extend quality scoring with Conversion (business-goal fit) + Accessibility
 * heuristics, branded as Magic Score.
 */
export function computeMagicScore(
  spec: SiteSpec,
  issues: ValidationIssue[],
  options?: {
    html?: string;
    brief?: string;
    goal?: string;
  },
): MagicScoreReport {
  const html = options?.html || "";
  const brief = options?.brief || "";
  const notes: string[] = [];

  // Design
  let design = 100;
  for (const issue of issues) {
    design -= issue.severity === "error" ? 12 : 4;
  }
  if (spec.design && Object.keys(spec.design).length >= 2) design += 4;
  else notes.push("Add design tokens for stronger brand consistency.");
  design = clamp(design);

  // UX (was mobile-focused; broaden)
  let ux = 72;
  const sectionCount = spec.pages.reduce((n, p) => n + p.sections.length, 0);
  if (sectionCount >= 5 && sectionCount <= 8) ux += 10;
  if (sectionCount > 10) ux -= 12;
  const hasHero = spec.pages.some((p) =>
    p.sections.some((s) => s.id.startsWith("hero_")),
  );
  const hasCta = spec.pages.some((p) =>
    p.sections.some((s) => /cta|contact|pricing/.test(s.id)),
  );
  if (hasHero) ux += 6;
  else {
    ux -= 15;
    notes.push("Missing hero — UX suffers above the fold.");
  }
  if (hasCta) ux += 6;
  if (issues.some((i) => /overflow|width|mobile/i.test(i.message))) ux -= 15;
  ux = clamp(ux);

  // SEO
  let seo = 60;
  if (spec.seo?.title) seo += 12;
  if (spec.seo?.description) seo += 12;
  if ((spec.seo?.keywords?.length || 0) >= 3) seo += 8;
  if (spec.seo?.title && spec.seo.title.length <= 70) seo += 4;
  if (spec.seo?.description && spec.seo.description.length <= 160) seo += 4;
  if (!spec.seo?.title || !spec.seo?.description) {
    seo -= 20;
    notes.push("SEO title/description incomplete.");
  }
  seo = clamp(seo);

  // Performance (pragmatic HTML heuristics)
  let performance = 70;
  if (html) {
    if (html.length < 80_000) performance += 10;
    else if (html.length > 200_000) performance -= 15;
    const imgCount = (html.match(/<img\b/gi) || []).length;
    if (imgCount <= 8) performance += 6;
    if (imgCount > 16) performance -= 10;
  }
  if (sectionCount <= 7) performance += 6;
  performance = clamp(performance);

  // Conversion — business-goal / DNA fit
  let conversion = 55;
  const dna = matchWebsiteDna(brief || spec.brand, spec.brand);
  const sectionIds = new Set(
    spec.pages.flatMap((p) => p.sections.map((s) => s.id)),
  );
  let dnaHits = 0;
  for (const s of dna.dna.bestSections.filter((x) => x.priority === "must")) {
    if (sectionIds.has(s.id)) dnaHits++;
  }
  const mustCount = dna.dna.bestSections.filter((x) => x.priority === "must").length || 1;
  conversion += Math.round((dnaHits / mustCount) * 30);
  const blob = JSON.stringify(spec).toLowerCase();
  for (const cta of dna.dna.ctas.primary) {
    if (blob.includes(cta.toLowerCase().slice(0, 12))) {
      conversion += 4;
      break;
    }
  }
  const goal = (options?.goal || "").toLowerCase();
  if (goal && blob.includes(goal.slice(0, 16))) conversion += 5;
  if (!hasCta) {
    conversion -= 12;
    notes.push("Weak conversion path — add CTA or contact.");
  }
  conversion = clamp(conversion);

  // Accessibility — pragmatic heuristics (not a full a11y audit)
  let accessibility = 70;
  if (spec.design?.text && spec.design?.surface) accessibility += 6;
  if (spec.design?.primary && spec.design?.accent) accessibility += 4;
  if (html) {
    const h1 = (html.match(/<h1\b/gi) || []).length;
    if (h1 === 1) accessibility += 8;
    else if (h1 === 0) {
      accessibility -= 15;
      notes.push("No H1 detected in render.");
    } else if (h1 > 2) accessibility -= 6;
    const buttons = (html.match(/<button\b/gi) || []).length;
    const links = (html.match(/<a\b/gi) || []).length;
    if (buttons + links >= 3) accessibility += 4;
    if (/alt=""/i.test(html)) {
      accessibility -= 8;
      notes.push("Empty image alt attributes found.");
    }
  }
  accessibility = clamp(accessibility);

  const overall = Math.round(
    design * 0.22 +
      ux * 0.18 +
      seo * 0.15 +
      performance * 0.12 +
      conversion * 0.2 +
      accessibility * 0.13,
  );

  const scores: MagicScore = {
    design,
    ux,
    seo,
    performance,
    conversion,
    accessibility,
    overall,
    mobile: ux,
  };

  return {
    scores,
    label: "Magic Score",
    passed: overall >= 70 && !issues.some((i) => i.severity === "error"),
    notes,
  };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
