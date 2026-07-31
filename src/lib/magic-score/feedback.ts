/**
 * Feedback intelligence v1 — persist good/bad evaluation patterns
 * for future prompts (JSON store + optional Prisma EvaluationPattern).
 */

export type EvaluationPattern = {
  id: string;
  kind: "good" | "bad";
  dimension: string;
  pattern: string;
  industry?: string;
  createdAt: string;
};

/** In-process seed patterns; DB persistence via recordEvaluationPattern when Prisma available. */
const SEED_PATTERNS: EvaluationPattern[] = [
  {
    id: "good-cta-repeat",
    kind: "good",
    dimension: "conversion",
    pattern: "Primary CTA appears in hero and again after social proof.",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "bad-generic-welcome",
    kind: "bad",
    dimension: "design",
    pattern: "Generic ‘welcome to our website’ or lorem ipsum copy.",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "good-single-h1",
    kind: "good",
    dimension: "accessibility",
    pattern: "Exactly one H1 in the rendered page.",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "bad-no-seo",
    kind: "bad",
    dimension: "seo",
    pattern: "Missing seo.title or seo.description on SiteSpec.",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "good-dna-must-sections",
    kind: "good",
    dimension: "conversion",
    pattern: "Includes DNA must-have sections for matched industry.",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

let runtimePatterns: EvaluationPattern[] = [];

export function listEvaluationPatterns(): EvaluationPattern[] {
  return [...SEED_PATTERNS, ...runtimePatterns];
}

export function patternsForPrompt(industry?: string): string {
  const all = listEvaluationPatterns().filter(
    (p) => !industry || !p.industry || p.industry === industry,
  );
  const good = all.filter((p) => p.kind === "good").slice(0, 4);
  const bad = all.filter((p) => p.kind === "bad").slice(0, 4);
  return [
    "Evaluation patterns (feedback intelligence v1):",
    ...good.map((p) => `GOOD [${p.dimension}]: ${p.pattern}`),
    ...bad.map((p) => `AVOID [${p.dimension}]: ${p.pattern}`),
  ].join("\n");
}

export function recordEvaluationPattern(
  input: Omit<EvaluationPattern, "id" | "createdAt"> & { id?: string },
): EvaluationPattern {
  const row: EvaluationPattern = {
    id: input.id || `pat_${Date.now().toString(36)}`,
    kind: input.kind,
    dimension: input.dimension,
    pattern: input.pattern,
    industry: input.industry,
    createdAt: new Date().toISOString(),
  };
  runtimePatterns = [row, ...runtimePatterns].slice(0, 100);
  return row;
}

/** Derive patterns from a Magic Score notes list. */
export function learnFromMagicNotes(
  notes: string[],
  scores: { overall: number; [k: string]: number },
  industry?: string,
): EvaluationPattern[] {
  const learned: EvaluationPattern[] = [];
  for (const note of notes.slice(0, 5)) {
    learned.push(
      recordEvaluationPattern({
        kind: scores.overall >= 70 ? "good" : "bad",
        dimension: "overall",
        pattern: note,
        industry,
      }),
    );
  }
  return learned;
}
