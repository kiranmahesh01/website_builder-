/**
 * Reviewer agent — the validation half of generate → run → validate → fix.
 *
 * Deterministic checks run first and cost nothing: schema, structure, slot
 * limits, asset sanity, token validity, reference resolution, and a real render
 * smoke test. Only if all of those pass is an optional model-based quality
 * judgment worth spending a call on.
 */

import { z } from "zod";
import { SECTION_BY_ID } from "@/lib/sections/registry";
import { renderSpecToHtml } from "@/lib/render-site";
import {
  DesignTokensSchema,
  SiteSpecSchema,
  sectionKey,
  type SiteSpec,
} from "@/lib/spec/schema";
import {
  validateSectionContent,
  validateStructure,
} from "@/lib/spec/validate";
import { contrastRatio } from "./colors";
import { agentJson, isOffline, type AgentLlmContext } from "./llm";
import type { ProjectMemoryModel } from "./memory";
import { computeMagicScore } from "@/lib/magic-score";
import type {
  AgentPlan,
  QualityScores,
  ReviewCheck,
  ReviewReport,
  ValidationIssue,
} from "./types";

/**
 * Deterministic design score (0–100). Errors hurt more than warnings;
 * having design tokens, SEO, and a full section set earns back points.
 */
export function computeDesignScore(
  spec: SiteSpec,
  issues: ValidationIssue[],
): number {
  let score = 100;
  for (const issue of issues) {
    score -= issue.severity === "error" ? 12 : 4;
  }

  if (spec.design && Object.keys(spec.design).length >= 2) score += 4;
  if (spec.seo?.title && spec.seo?.description) score += 4;
  else score -= 6;

  const sectionCount = spec.pages.reduce((n, p) => n + p.sections.length, 0);
  if (sectionCount >= 6) score += 3;
  if (sectionCount < 5) score -= 10;

  const hasHero = spec.pages.some((p) =>
    p.sections.some((s) => s.id.startsWith("hero_")),
  );
  if (!hasHero) score -= 15;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Multi-dimension Magic Score (deterministic, cheap). */
export function computeQualityScores(
  spec: SiteSpec,
  issues: ValidationIssue[],
  html?: string,
  brief?: string,
): QualityScores {
  const magic = computeMagicScore(spec, issues, { html, brief });
  return {
    design: magic.scores.design,
    mobile: magic.scores.mobile,
    seo: magic.scores.seo,
    performance: magic.scores.performance,
    overall: magic.scores.overall,
    ux: magic.scores.ux,
    conversion: magic.scores.conversion,
    accessibility: magic.scores.accessibility,
  };
}

/** Phrases that mark copy as generic filler rather than real business writing. */
const BANNED_PHRASES = [
  "lorem ipsum",
  "welcome to our website",
  "cutting-edge solutions",
  "your trusted partner",
  "transform your business",
  "your business name",
  "company name here",
  "insert text",
  "placeholder",
  "todo",
];

const MIN_RENDER_LENGTH = 1200;

function issue(
  code: string,
  message: string,
  extra: Partial<ValidationIssue> = {},
): ValidationIssue {
  return { code, severity: "error", message, ...extra };
}

function checkSchema(spec: unknown): ValidationIssue[] {
  const parsed = SiteSpecSchema.safeParse(spec);
  if (parsed.success) return [];
  return parsed.error.issues.slice(0, 10).map((zodIssue) =>
    issue("schema.invalid", zodIssue.message, {
      path: zodIssue.path.join("."),
      hint: `Fix the value at ${zodIssue.path.join(".")} so it satisfies the SiteSpec schema.`,
    }),
  );
}

function checkStructure(spec: SiteSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const page of spec.pages) {
    const error = validateStructure(page.sections.map((s) => s.id));
    if (error) {
      issues.push(
        issue("structure.invalid", `Page "${page.slug}": ${error}`, {
          path: `pages.${page.slug}`,
          hint: "Reorder or add sections so the page opens with a hero, ends with footer_simple, and has 5–8 sections.",
        }),
      );
    }
  }
  return issues;
}

function checkContent(spec: SiteSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const page of spec.pages) {
    page.sections.forEach((section, index) => {
      const key = section.key || sectionKey(page.slug, section.id, index);
      const error = validateSectionContent(section.id, section.content);
      if (error) {
        issues.push(
          issue("content.slot", `${key}: ${error}`, {
            sectionKey: key,
            path: `pages.${page.slug}.sections.${index}`,
            hint: `Fix ${key} so that: ${error}`,
          }),
        );
      }

      for (const [slot, value] of Object.entries(section.content)) {
        if (typeof value !== "string") continue;
        const lower = value.toLowerCase();
        const banned = BANNED_PHRASES.find((phrase) => lower.includes(phrase));
        if (banned) {
          issues.push({
            code: "content.filler",
            severity: "warning",
            message: `${key}.${slot} contains filler copy ("${banned}")`,
            sectionKey: key,
            slot,
            hint: `Rewrite ${key}.${slot} with specific copy about the real business.`,
          });
        }
      }
    });
  }

  return issues;
}

function checkAssets(spec: SiteSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const inspect = (
    key: string,
    slot: string,
    value: unknown,
    isImageSlot: boolean,
  ) => {
    if (typeof value === "string") {
      if (isImageSlot && value.trim() === "") {
        issues.push(
          issue("asset.empty", `${key}.${slot} image is empty`, {
            sectionKey: key,
            slot,
            hint: `Set ${key}.${slot} to { "query": "relevant stock photo search terms" }.`,
          }),
        );
        return;
      }
      if (/^https?:\/\//i.test(value)) {
        try {
          const url = new URL(value);
          if (url.protocol !== "https:") {
            issues.push(
              issue("asset.insecure", `${key}.${slot} uses a non-https URL`, {
                sectionKey: key,
                slot,
                hint: `Replace ${key}.${slot} with an https URL or an image query object.`,
              }),
            );
          }
        } catch {
          issues.push(
            issue("asset.malformed", `${key}.${slot} is not a valid URL`, {
              sectionKey: key,
              slot,
              hint: `Replace ${key}.${slot} with { "query": "..." }.`,
            }),
          );
        }
      }
      return;
    }

    if (isImageSlot) {
      const query = (value as { query?: unknown } | null)?.query;
      if (typeof query !== "string" || !query.trim()) {
        issues.push(
          issue("asset.missing", `${key}.${slot} has no image or query`, {
            sectionKey: key,
            slot,
            hint: `Set ${key}.${slot} to { "query": "relevant stock photo search terms" }.`,
          }),
        );
      }
    }
  };

  for (const page of spec.pages) {
    page.sections.forEach((section, index) => {
      const key = section.key || sectionKey(page.slug, section.id, index);
      const meta = SECTION_BY_ID[section.id];
      for (const [slot, value] of Object.entries(section.content)) {
        inspect(key, slot, value, meta?.slots?.[slot]?.type === "image");
      }
    });
  }

  return issues;
}

function checkTokens(spec: SiteSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const validate = (tokens: unknown, where: string, key?: string) => {
    const parsed = DesignTokensSchema.safeParse(tokens);
    if (parsed.success) return;
    for (const zodIssue of parsed.error.issues.slice(0, 4)) {
      issues.push(
        issue("token.invalid", `${where}: ${zodIssue.message}`, {
          sectionKey: key,
          path: `${where}.${zodIssue.path.join(".")}`,
          hint: `Remove or correct the ${zodIssue.path.join(".")} token — colours must be hex like #2563EB.`,
        }),
      );
    }
  };

  if (spec.design) validate(spec.design, "design");

  for (const page of spec.pages) {
    page.sections.forEach((section, index) => {
      if (!section.tokens) return;
      const key = section.key || sectionKey(page.slug, section.id, index);
      validate(section.tokens, `${key}.tokens`, key);

      const bg = section.tokens.buttonBg || spec.design?.buttonBg;
      const fg = section.tokens.buttonText || spec.design?.buttonText;
      if (bg && fg && contrastRatio(bg, fg) < 3) {
        issues.push({
          code: "token.contrast",
          severity: "warning",
          message: `${key} button text is hard to read on its background`,
          sectionKey: key,
          hint: `Set a buttonText colour with more contrast against ${bg}.`,
        });
      }
    });
  }

  const bg = spec.design?.buttonBg;
  const fg = spec.design?.buttonText;
  if (bg && fg && contrastRatio(bg, fg) < 3) {
    issues.push({
      code: "token.contrast",
      severity: "warning",
      message: "Site button text is hard to read on its background",
      hint: `Set a buttonText colour with more contrast against ${bg}.`,
    });
  }

  return issues;
}

function checkReferences(spec: SiteSpec, plan?: AgentPlan | null): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const keys = new Set<string>();

  for (const page of spec.pages) {
    page.sections.forEach((section, index) => {
      const key = section.key || sectionKey(page.slug, section.id, index);
      if (keys.has(key)) {
        issues.push(
          issue("reference.duplicate", `Duplicate section key ${key}`, {
            sectionKey: key,
            hint: "Give every section a unique key.",
          }),
        );
      }
      keys.add(key);
      if (!SECTION_BY_ID[section.id]) {
        issues.push(
          issue("reference.unknown_section", `Unknown section type ${section.id}`, {
            sectionKey: key,
            hint: `Replace ${section.id} with a section type from the registry.`,
          }),
        );
      }
    });
  }

  for (const target of plan?.targets || []) {
    if (!("sectionKey" in target)) continue;
    if (keys.has(target.sectionKey)) continue;
    issues.push(
      issue(
        "reference.missing_target",
        `Plan targeted ${target.sectionKey}, which no longer exists`,
        {
          sectionKey: target.sectionKey,
          hint: "Apply the change to a section that exists in the site.",
        },
      ),
    );
  }

  return issues;
}

async function checkRender(
  spec: SiteSpec,
): Promise<{ issues: ValidationIssue[]; html?: string }> {
  try {
    const html = await renderSpecToHtml(spec);
    if (html.length < MIN_RENDER_LENGTH) {
      return {
        issues: [
          issue(
            "render.too_small",
            `Rendered page is only ${html.length} characters — sections are probably empty`,
            { hint: "Fill the empty section slots with real copy." },
          ),
        ],
        html,
      };
    }
    if (!html.includes(spec.brand)) {
      return {
        issues: [
          {
            code: "render.missing_brand",
            severity: "warning",
            message: `Rendered page never mentions the brand "${spec.brand}"`,
            hint: "Use the brand name in the hero or footer copy.",
          },
        ],
        html,
      };
    }
    return { issues: [], html };
  } catch (error) {
    return {
      issues: [
        issue(
          "render.threw",
          `Rendering failed: ${error instanceof Error ? error.message : "unknown error"}`,
          { hint: "Remove the content that breaks rendering." },
        ),
      ],
    };
  }
}

/**
 * Run every deterministic check. `passed` is false only for error-severity
 * issues — warnings are reported to the fix agent but never block a run.
 */
export async function reviewSpec(input: {
  spec: SiteSpec;
  plan?: AgentPlan | null;
  render?: boolean;
}): Promise<ReviewReport> {
  const checks: ReviewCheck[] = [];
  const issues: ValidationIssue[] = [];

  const record = (name: string, found: ValidationIssue[]) => {
    const errors = found.filter((i) => i.severity === "error");
    checks.push({
      name,
      passed: errors.length === 0,
      detail: found[0]?.message,
    });
    issues.push(...found);
  };

  const schemaIssues = checkSchema(input.spec);
  record("schema", schemaIssues);

  if (schemaIssues.length > 0) {
    const score = computeDesignScore(input.spec as SiteSpec, issues);
    return {
      passed: false,
      score,
      scores: computeQualityScores(input.spec as SiteSpec, issues),
      issues,
      checks,
    };
  }

  record("structure", checkStructure(input.spec));
  record("content", checkContent(input.spec));
  record("assets", checkAssets(input.spec));
  record("tokens", checkTokens(input.spec));
  record("references", checkReferences(input.spec, input.plan));

  let html: string | undefined;
  if (input.render !== false) {
    const rendered = await checkRender(input.spec);
    html = rendered.html;
    record("render", rendered.issues);
  }

  const scores = computeQualityScores(input.spec, issues, html);
  const score = scores.overall;
  checks.push({
    name: "design_score",
    passed: scores.design >= 70,
    detail: `${scores.design}/100`,
  });
  checks.push({
    name: "quality_breakdown",
    passed: scores.overall >= 70,
    detail: `Magic Score ${scores.overall} · design ${scores.design} · ux ${scores.ux ?? scores.mobile} · conversion ${scores.conversion ?? "—"} · a11y ${scores.accessibility ?? "—"}`,
  });

  return {
    passed: issues.every((i) => i.severity !== "error"),
    score,
    scores,
    issues,
    checks,
    html,
  };
}

const QualityResponseSchema = z.object({
  passed: z.boolean(),
  score: z.number().min(0).max(100).optional(),
  issues: z
    .array(
      z.object({
        sectionKey: z.string().optional(),
        slot: z.string().optional(),
        problem: z.string().min(1).max(200),
        fix: z.string().min(1).max(200),
      }),
    )
    .max(6)
    .default([]),
});

/**
 * Optional model-based quality pass. Only worth running once the deterministic
 * checks are clean, and it can only produce warnings — a subjective judgment
 * should never block a user's edit.
 */
export async function reviewQuality(input: {
  spec: SiteSpec;
  request: string;
  memory: ProjectMemoryModel;
  ctx: AgentLlmContext;
}): Promise<ValidationIssue[]> {
  if (isOffline(input.ctx)) return [];

  const copy = input.memory.pages.flatMap((page) =>
    page.sections.flatMap((section) =>
      section.components
        .filter((c) => c.kind !== "image" && c.value)
        .map((c) => `${c.key}: ${c.value.slice(0, 120)}`),
    ),
  );

  const json = await agentJson(
    input.ctx,
    [
      {
        role: "system",
        content: `You are the REVIEWER agent for Magic AI. Output STRICT JSON only.

Judge whether a website's copy actually satisfies the user's request and reads like a real business wrote it.

Output shape:
{ "passed": true, "score": 0-100, "issues": [{ "sectionKey": "...", "slot": "...", "problem": "...", "fix": "..." }] }

Rules:
- Fail only for real problems: the request was ignored, copy is generic filler, or the brand/offer is wrong.
- Do not fail for taste. Do not suggest adding sections.
- Keep each problem and fix under 25 words.
- Return ONLY valid JSON.`,
      },
      {
        role: "user",
        content: `User request:\n${input.request}\n\nBrand: ${input.memory.brand}\n\nCopy on the page:\n${copy.join("\n")}`,
      },
    ],
    700,
  );

  const parsed = json ? QualityResponseSchema.safeParse(json) : null;
  if (!parsed?.success || parsed.data.passed) return [];

  return parsed.data.issues.map((i) => ({
    code: "quality.judge",
    severity: "warning" as const,
    message: i.problem,
    sectionKey: i.sectionKey,
    slot: i.slot,
    hint: i.fix,
  }));
}

export function summarizeIssues(issues: ValidationIssue[]): string {
  if (issues.length === 0) return "no issues";
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.length - errors;
  const parts: string[] = [];
  if (errors) parts.push(`${errors} error${errors === 1 ? "" : "s"}`);
  if (warnings) parts.push(`${warnings} warning${warnings === 1 ? "" : "s"}`);
  return parts.join(", ");
}
