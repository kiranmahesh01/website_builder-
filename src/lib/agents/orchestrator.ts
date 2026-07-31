/**
 * Orchestrator — Manager-driven agent loop.
 *
 * Generate: Manager → retrieve KB → Planner → Designer → Developer → Reviewer → Fixer
 * Refine:   Manager → Planner → Developer → Reviewer → Fixer
 *           (Designer runs on regenerate intent)
 *
 * Bounded by maxFixAttempts and a hard LLM call ceiling. Never spins forever.
 */

import { retrieveTemplates } from "@/lib/knowledge";
import { enrichSpecWithImages } from "@/lib/spec/images";
import { specToWebsite } from "@/lib/spec/to-website";
import { renderSpecToHtml } from "@/lib/render-site";
import { withSectionKeys, type SiteSpec } from "@/lib/spec/schema";
import type { Website } from "@/lib/schema";
import type { LlmProvider } from "@/lib/llm/types";
import {
  runDesigner,
  type WebsiteBlueprint,
} from "./designer";
import { runDeveloperGenerate, runDeveloperPatch } from "./developer";
import { runFixer } from "./fixer";
import { newLlmBudget, type AgentLlmContext } from "./llm";
import { decideNextStep, type ManagerState } from "./manager";
import { buildMemory, type ProjectMemoryModel } from "./memory";
import { describeOp, type PatchOp } from "./patch";
import { runGeneratePlanner, runPlanner } from "./planner";
import { reviewQuality, reviewSpec, summarizeIssues } from "./reviewer";
import { ensureSeo } from "./seo";
import {
  AGENT_BUDGET,
  DESIGN_SCORE_THRESHOLD,
  type AgentEvent,
  type AgentPlan,
  type AgentRole,
  type ReviewReport,
} from "./types";

export type AgentRunInput = {
  mode: "generate" | "refine";
  request: string;
  provider: LlmProvider;
  model?: string | null;
  /** Required for refine; ignored for generate. */
  spec?: SiteSpec | null;
  memory?: ProjectMemoryModel | null;
  theme?: string | null;
  uiKit?: string | null;
  maxFixAttempts?: number;
  /** Spend a model call on subjective copy review once the hard checks pass. */
  judge?: boolean;
  onEvent?: (event: AgentEvent) => void;
};

export type AgentRunResult = {
  spec: SiteSpec;
  website: Website;
  html: string;
  memory: ProjectMemoryModel;
  plan: AgentPlan | null;
  blueprint: WebsiteBlueprint | null;
  ops: PatchOp[];
  review: ReviewReport;
  attempts: number;
  events: AgentEvent[];
  summary: string;
  passed: boolean;
  changed: boolean;
  llmCalls: number;
};

function nextEvent(
  events: AgentEvent[],
  onEvent: ((event: AgentEvent) => void) | undefined,
  role: AgentRole,
  type: AgentEvent["type"],
  message: string,
  attempt?: number,
): void {
  const event: AgentEvent = { role, type, message, attempt, at: Date.now() };
  events.push(event);
  onEvent?.(event);
}

function specsEqual(a: SiteSpec, b: SiteSpec): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

const MAX_MANAGER_TICKS = 16;

export async function runAgentLoop(
  input: AgentRunInput,
): Promise<AgentRunResult> {
  const events: AgentEvent[] = [];
  const emit = (
    role: AgentRole,
    type: AgentEvent["type"],
    message: string,
    attempt?: number,
  ) => nextEvent(events, input.onEvent, role, type, message, attempt);

  const ctx: AgentLlmContext = {
    provider: input.provider,
    model: input.model,
    budget: newLlmBudget(AGENT_BUDGET.maxLlmCalls),
  };
  const maxFixAttempts = input.maxFixAttempts ?? AGENT_BUDGET.maxFixAttempts;

  emit("orchestrator", "start", `Starting ${input.mode} run`);

  let plan: AgentPlan | null = null;
  let blueprint: WebsiteBlueprint | null = null;
  let spec: SiteSpec | null =
    input.mode === "refine" && input.spec
      ? withSectionKeys(input.spec)
      : null;
  const startingSpec = spec;
  let developed = false;
  const ops: PatchOp[] = [];
  let review: ReviewReport | null = null;
  let fixAttempts = 0;
  let reviewPasses = 0;

  let retrieved =
    input.mode === "generate" || !startingSpec
      ? retrieveTemplates(input.request)
      : null;

  if (retrieved) {
    emit(
      "manager",
      "progress",
      retrieved.matches.length > 0
        ? `KB matched ${retrieved.matches.map((m) => m.template.id).join(", ")} (${retrieved.confidence})`
        : "KB found no strong industry match",
    );
  }

  for (let tick = 0; tick < MAX_MANAGER_TICKS; tick++) {
    const runMode: ManagerState["mode"] =
      input.mode === "generate" || !startingSpec ? "generate" : "refine";
    const state: ManagerState = {
      mode: runMode,
      plan,
      blueprint,
      developed,
      reviewPassed: review ? review.passed : null,
      scoreBelowThreshold: review
        ? review.score < DESIGN_SCORE_THRESHOLD
        : false,
      fixAttempts,
      maxFixAttempts,
      llmCallsUsed: ctx.budget.used,
      llmCallsMax: ctx.budget.max,
      wantsDesign: runMode === "generate" || plan?.intent === "regenerate",
    };

    const decision = decideNextStep(state);
    emit("manager", "progress", `${decision.step}: ${decision.reason}`);

    if (decision.step === "done") break;

    if (decision.step === "plan") {
      emit("planner", "start", "Reading the brief");
      if (state.mode === "generate") {
        plan = await runGeneratePlanner({
          request: input.request,
          retrieved: retrieved ?? undefined,
          ctx,
        });
      } else {
        const memory = input.memory || buildMemory(startingSpec!);
        plan = await runPlanner({
          request: input.request,
          memory,
          ctx,
        });
      }
      emit(
        "planner",
        "done",
        plan.industry
          ? `${plan.summary} [${plan.industry}]`
          : plan.targets.length > 0
            ? `Targeting ${plan.targets.map((t) => t.label).join(", ")}`
            : plan.summary,
      );
      continue;
    }

    if (decision.step === "design") {
      emit("designer", "start", "Building the website blueprint");
      if (!retrieved) {
        retrieved = retrieveTemplates(input.request);
      }
      blueprint = await runDesigner({
        brief: input.request,
        retrieved,
        ctx,
        // Prefer deterministic when budget is tight.
        forceDeterministic: ctx.budget.used >= ctx.budget.max - 1,
      });
      emit(
        "designer",
        "done",
        `${blueprint.industry} · ${blueprint.sections.length} sections · ${blueprint.source}`,
      );
      continue;
    }

    if (decision.step === "develop") {
      if (state.mode === "generate" || plan?.intent === "regenerate") {
        emit("developer", "start", "Generating pages, sections and copy");
        spec = await runDeveloperGenerate({
          prompt: input.request,
          provider: input.provider,
          theme: input.theme || blueprint?.theme,
          uiKit: input.uiKit,
          model: input.model,
          blueprint,
        });
        emit(
          "developer",
          "done",
          `Built ${spec.pages.length} page${spec.pages.length === 1 ? "" : "s"}, ${spec.pages.reduce((n, p) => n + p.sections.length, 0)} sections`,
        );
      } else {
        emit("developer", "start", "Writing a scoped patch");
        const memory = input.memory || buildMemory(startingSpec!);
        const result = await runDeveloperPatch({
          request: input.request,
          spec: startingSpec!,
          memory,
          plan: plan!,
          ctx,
        });
        spec = result.spec;
        ops.push(...result.ops);
        emit(
          "developer",
          result.ops.length > 0 ? "done" : "fail",
          result.ops.length > 0
            ? `Applied ${result.ops.length} edit${result.ops.length === 1 ? "" : "s"}: ${result.ops.map(describeOp).join("; ")}`
            : "Could not turn that request into a concrete edit",
        );
      }
      developed = true;
      // Force a fresh review after every develop.
      review = null;
      continue;
    }

    if (decision.step === "review") {
      reviewPasses += 1;
      spec = ensureSeo(spec!);
      review = await reviewSpec({ spec, plan });
      const scoreNote = `score ${review.score}/100`;
      emit(
        "reviewer",
        review.passed && review.score >= DESIGN_SCORE_THRESHOLD
          ? "pass"
          : "fail",
        review.passed
          ? review.score >= DESIGN_SCORE_THRESHOLD
            ? `All checks passed · ${scoreNote}`
            : `Hard checks ok but ${scoreNote} (threshold ${DESIGN_SCORE_THRESHOLD})`
          : `Found ${summarizeIssues(review.issues)} · ${scoreNote}`,
        reviewPasses,
      );
      continue;
    }

    if (decision.step === "fix") {
      fixAttempts += 1;
      emit(
        "fixer",
        "retry",
        `Repairing ${summarizeIssues(review!.issues)} (attempt ${fixAttempts} of ${maxFixAttempts})`,
        fixAttempts,
      );

      const fix = await runFixer({
        spec: spec!,
        issues: review!.issues,
        request: input.request,
        ctx,
      });

      if (fix.repaired.length === 0) {
        emit("fixer", "fail", "No repair was possible for the remaining issues");
        // Mark as reviewed-but-failed with no further progress possible.
        fixAttempts = maxFixAttempts;
        continue;
      }

      spec = fix.spec;
      ops.push(...fix.ops);
      emit("fixer", "done", fix.repaired.slice(0, 4).join("; "));
      review = null;
      continue;
    }
  }

  if (!spec) {
    // Should be unreachable — develop always produces a spec in generate mode.
    emit("orchestrator", "error", "Run ended without a site spec");
    throw new Error("Agent run produced no site spec");
  }

  if (!review) {
    review = await reviewSpec({ spec, plan });
    emit(
      "reviewer",
      review.passed && review.score >= DESIGN_SCORE_THRESHOLD ? "pass" : "fail",
      review.passed
        ? `All checks passed · score ${review.score}/100`
        : `Found ${summarizeIssues(review.issues)} · score ${review.score}/100`,
    );
  }

  if (review.passed && input.judge) {
    const memoryForJudge = buildMemory(spec);
    const qualityIssues = await reviewQuality({
      spec,
      request: input.request,
      memory: memoryForJudge,
      ctx,
    });
    if (qualityIssues.length > 0) {
      review = {
        ...review,
        issues: [...review.issues, ...qualityIssues],
        score: Math.max(0, review.score - qualityIssues.length * 4),
      };
      emit(
        "reviewer",
        "fail",
        `Copy review flagged ${qualityIssues.length} item${qualityIssues.length === 1 ? "" : "s"} · score ${review.score}/100`,
      );
    }
  }

  // Ensure designer tokens land on the spec even if the pipeline omitted them.
  if (
    blueprint?.design &&
    Object.keys(blueprint.design).length > 0 &&
    (!spec.design || Object.keys(spec.design).length === 0)
  ) {
    spec = { ...spec, design: blueprint.design };
  }

  // Phase 5: deterministic SEO from brand + hero (no extra LLM call).
  spec = ensureSeo(spec);
  emit("orchestrator", "progress", "SEO title/description ensured");

  // Decided before image enrichment, which resolves queries to URLs and would
  // otherwise look like an edit the user asked for.
  const changed = !startingSpec || !specsEqual(startingSpec, spec);

  spec = withSectionKeys(await enrichSpecWithImages(spec));
  const html = await renderSpecToHtml(spec);
  const website = specToWebsite(spec, {
    theme: input.theme || blueprint?.theme || spec.theme,
    uiKit: input.uiKit,
  });
  const memory = buildMemory(spec, (input.memory?.revision ?? 0) + 1);

  const summary = !changed
    ? "No change was applied — try naming the section or wording it differently."
    : input.mode === "generate" || !startingSpec
      ? `Built ${spec.pages.length} page${spec.pages.length === 1 ? "" : "s"} and ${spec.pages.reduce((n, p) => n + p.sections.length, 0)} sections${review.passed ? "" : ` (${summarizeIssues(review.issues)} remaining)`}`
      : `${ops.map(describeOp).join("; ") || plan?.summary || "Updated the site"}${review.passed ? "" : ` (${summarizeIssues(review.issues)} remaining)`}`;

  emit(
    "orchestrator",
    review.passed ? "done" : "error",
    summary,
    Math.max(1, reviewPasses),
  );

  return {
    spec,
    website,
    html,
    memory,
    plan,
    blueprint,
    ops,
    review,
    attempts: Math.max(1, reviewPasses),
    events,
    summary,
    passed: review.passed,
    changed,
    llmCalls: ctx.budget.used,
  };
}
