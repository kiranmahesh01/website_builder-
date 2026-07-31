/**
 * Orchestrator — runs user → planner → developer → reviewer → fixer → reviewer.
 *
 * The loop is bounded twice over: at most `maxFixAttempts` repair rounds, and a
 * hard ceiling on model calls for the whole run. It can never spin, and a run
 * that exhausts its budget returns the best spec it has along with the issues
 * that are still outstanding.
 */

import { enrichSpecWithImages } from "@/lib/spec/images";
import { specToWebsite } from "@/lib/spec/to-website";
import { renderSpecToHtml } from "@/lib/render-site";
import { withSectionKeys, type SiteSpec } from "@/lib/spec/schema";
import type { Website } from "@/lib/schema";
import type { LlmProvider } from "@/lib/llm/types";
import { describeOp, type PatchOp } from "./patch";
import { runDeveloperGenerate, runDeveloperPatch } from "./developer";
import { runFixer } from "./fixer";
import { newLlmBudget, type AgentLlmContext } from "./llm";
import { buildMemory, type ProjectMemoryModel } from "./memory";
import { runPlanner } from "./planner";
import { reviewQuality, reviewSpec, summarizeIssues } from "./reviewer";
import {
  AGENT_BUDGET,
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
  let spec: SiteSpec;
  const ops: PatchOp[] = [];
  const startingSpec = input.spec ? withSectionKeys(input.spec) : null;

  if (input.mode === "generate" || !startingSpec) {
    emit("planner", "start", "Reading the brief");
    emit("developer", "start", "Generating pages, sections and copy");
    spec = await runDeveloperGenerate({
      prompt: input.request,
      provider: input.provider,
      theme: input.theme,
      uiKit: input.uiKit,
      model: input.model,
    });
    emit(
      "developer",
      "done",
      `Built ${spec.pages.length} page${spec.pages.length === 1 ? "" : "s"}, ${spec.pages.reduce((n, p) => n + p.sections.length, 0)} sections`,
    );
  } else {
    const memory = input.memory || buildMemory(startingSpec);

    emit("planner", "start", "Locating the change in project memory");
    plan = await runPlanner({ request: input.request, memory, ctx });
    emit(
      "planner",
      "done",
      plan.targets.length > 0
        ? `Targeting ${plan.targets.map((t) => t.label).join(", ")}`
        : plan.summary,
    );

    if (plan.intent === "regenerate") {
      emit("developer", "start", "Rebuilding the site from scratch");
      spec = await runDeveloperGenerate({
        prompt: input.request,
        provider: input.provider,
        theme: input.theme,
        uiKit: input.uiKit,
        model: input.model,
      });
      emit("developer", "done", "Rebuilt the site");
    } else {
      emit("developer", "start", "Writing a scoped patch");
      const result = await runDeveloperPatch({
        request: input.request,
        spec: startingSpec,
        memory,
        plan,
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
  }

  let review = await reviewSpec({ spec, plan });
  let attempts = 1;
  emit(
    "reviewer",
    review.passed ? "pass" : "fail",
    review.passed
      ? "All checks passed"
      : `Found ${summarizeIssues(review.issues)}`,
    attempts,
  );

  while (!review.passed && attempts <= maxFixAttempts) {
    emit(
      "fixer",
      "retry",
      `Repairing ${summarizeIssues(review.issues)} (attempt ${attempts} of ${maxFixAttempts})`,
      attempts,
    );

    const fix = await runFixer({
      spec,
      issues: review.issues,
      request: input.request,
      ctx,
    });

    if (fix.repaired.length === 0) {
      emit("fixer", "fail", "No repair was possible for the remaining issues");
      break;
    }

    spec = fix.spec;
    ops.push(...fix.ops);
    emit("fixer", "done", fix.repaired.slice(0, 4).join("; "));

    attempts += 1;
    review = await reviewSpec({ spec, plan });
    emit(
      "reviewer",
      review.passed ? "pass" : "fail",
      review.passed
        ? "All checks passed after repair"
        : `Still ${summarizeIssues(review.issues)}`,
      attempts,
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
      };
      emit(
        "reviewer",
        "fail",
        `Copy review flagged ${qualityIssues.length} item${qualityIssues.length === 1 ? "" : "s"}`,
      );
    }
  }

  // Decided before image enrichment, which resolves queries to URLs and would
  // otherwise look like an edit the user asked for.
  const changed = !startingSpec || !specsEqual(startingSpec, spec);

  spec = withSectionKeys(await enrichSpecWithImages(spec));
  const html = await renderSpecToHtml(spec);
  const website = specToWebsite(spec, {
    theme: input.theme || spec.theme,
    uiKit: input.uiKit,
  });
  const memory = buildMemory(spec, (input.memory?.revision ?? 0) + 1);

  const summary = !changed
    ? "No change was applied — try naming the section or wording it differently."
    : input.mode === "generate"
      ? `Built ${spec.pages.length} page${spec.pages.length === 1 ? "" : "s"} and ${spec.pages.reduce((n, p) => n + p.sections.length, 0)} sections${review.passed ? "" : ` (${summarizeIssues(review.issues)} remaining)`}`
      : `${ops.map(describeOp).join("; ") || plan?.summary || "Updated the site"}${review.passed ? "" : ` (${summarizeIssues(review.issues)} remaining)`}`;

  emit(
    "orchestrator",
    review.passed ? "done" : "error",
    summary,
    attempts,
  );

  return {
    spec,
    website,
    html,
    memory,
    plan,
    ops,
    review,
    attempts,
    events,
    summary,
    passed: review.passed,
    changed,
    llmCalls: ctx.budget.used,
  };
}
