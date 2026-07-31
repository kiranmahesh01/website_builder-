"use client";

export type CriticIssue = {
  code: string;
  severity: string;
  message: string;
  hint?: string;
  path?: string;
  sectionKey?: string;
};

export type QualityScores = {
  design: number;
  mobile: number;
  seo: number;
  performance: number;
  overall: number;
  ux?: number;
  conversion?: number;
  accessibility?: number;
};

export type CriticReview = {
  score: number;
  passed: boolean;
  scores?: QualityScores;
  issues: CriticIssue[];
};

/**
 * Post-generation AI Website Critic — multi-score + issues + Auto improve.
 */
export function DesignCritic({
  review,
  busy,
  onAutoImprove,
}: {
  review: CriticReview | null;
  busy: boolean;
  onAutoImprove: () => void;
}) {
  if (!review) return null;

  const issueCount = review.issues.length;
  const scores = review.scores || {
    design: review.score,
    mobile: review.score,
    seo: review.score,
    performance: review.score,
    overall: review.score,
  };
  const scoreOk = scores.overall >= 70;

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-ink-soft/80 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-mist">
            Magic Score
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-sm font-semibold text-fog">
            Overall{" "}
            <span className={scoreOk ? "text-lime" : "text-coral"}>
              {scores.overall}/100
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onAutoImprove}
          disabled={busy || (scoreOk && issueCount === 0)}
          className="shrink-0 rounded-full bg-lime px-3 py-1.5 text-[11px] font-semibold text-ink disabled:opacity-40"
        >
          Auto fix
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {(
          [
            ["Design", scores.design],
            ["UX", scores.ux ?? scores.mobile],
            ["SEO", scores.seo],
            ["Perf", scores.performance],
            ["Convert", scores.conversion ?? scores.overall],
            ["A11y", scores.accessibility ?? scores.mobile],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--line)] px-2 py-1.5"
          >
            <p className="text-[9px] uppercase tracking-[0.14em] text-mist">
              {label}
            </p>
            <p
              className={`text-sm tabular-nums ${
                value >= 70 ? "text-lime" : "text-coral"
              }`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {issueCount === 0 ? (
        <p className="mt-2 text-[11px] leading-snug text-mist">
          {review.passed
            ? "Checks passed — polish in chat or publish when ready."
            : "No open issues listed. Use chat for targeted edits."}
        </p>
      ) : (
        <ul className="mt-2 max-h-36 space-y-1.5 overflow-y-auto">
          {review.issues.slice(0, 6).map((issue, i) => (
            <li
              key={`${issue.code}-${i}`}
              className="text-[11px] leading-snug text-mist"
            >
              <span
                className={
                  issue.severity === "error" ? "text-coral" : "text-lime-deep"
                }
              >
                {issue.severity === "error" ? "Issue" : "Note"}
              </span>
              <span className="text-mist"> — </span>
              <span className="text-fog">{issue.message}</span>
              {issue.hint ? (
                <span className="block pl-3 text-mist">{issue.hint}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function buildAutoImproveMessage(review: CriticReview): string {
  const scores = review.scores;
  const lines = review.issues.slice(0, 8).map((issue, i) => {
    const hint = issue.hint ? ` Hint: ${issue.hint}` : "";
    return `${i + 1}. [${issue.severity}] ${issue.message}.${hint}`;
  });
  return [
    "Auto-fix this website using Magic Score findings.",
    scores
      ? `Magic Score — overall ${scores.overall}, design ${scores.design}, UX ${scores.ux ?? scores.mobile}, SEO ${scores.seo}, performance ${scores.performance}, conversion ${scores.conversion ?? "n/a"}, accessibility ${scores.accessibility ?? "n/a"}.`
      : `Current Magic Score: ${review.score}/100.`,
    "Fix these issues without changing the business or brand:",
    ...(lines.length
      ? lines
      : [
          "Improve contrast, tighten hero copy, strengthen SEO title/description, conversion CTA, and accessibility.",
        ]),
    "Prefer concrete visual and content fixes over rewriting the whole site.",
  ].join("\n");
}
