/**
 * Manager agent — decides the next step of a run from current state.
 *
 * Keeps the loop bounded: it never invents unbounded retries, and it prefers
 * skipping optional LLM roles when the budget is nearly spent.
 */

import type { WebsiteBlueprint } from "./designer";
import type { AgentPlan } from "./types";

export const MANAGER_STEPS = [
  "plan",
  "design",
  "develop",
  "review",
  "fix",
  "done",
] as const;

export type ManagerStep = (typeof MANAGER_STEPS)[number];

export type ManagerState = {
  mode: "generate" | "refine";
  plan: AgentPlan | null;
  blueprint: WebsiteBlueprint | null;
  /** True only after the developer has run in this loop (not the starting spec). */
  developed: boolean;
  /** null = not reviewed yet */
  reviewPassed: boolean | null;
  /** True when design score is below DESIGN_SCORE_THRESHOLD. */
  scoreBelowThreshold: boolean;
  fixAttempts: number;
  maxFixAttempts: number;
  llmCallsUsed: number;
  llmCallsMax: number;
  /** True when refine plan says regenerate — designer may run again. */
  wantsDesign: boolean;
};

export type ManagerDecision = {
  step: ManagerStep;
  reason: string;
};

/**
 * Pure state machine. No I/O — unit-tested offline in eval:agents.
 */
export function decideNextStep(state: ManagerState): ManagerDecision {
  const budgetLeft = state.llmCallsMax - state.llmCallsUsed;

  if (!state.plan) {
    return { step: "plan", reason: "No plan yet — planner runs first" };
  }

  const needsDesign =
    state.mode === "generate" ||
    (state.mode === "refine" && state.wantsDesign);

  if (needsDesign && !state.blueprint) {
    // If the LLM budget is already exhausted, still emit a design step —
    // designer falls back to deterministic KB fill.
    return {
      step: "design",
      reason: "Blueprint missing — designer sets structure and tokens before build",
    };
  }

  if (!state.developed) {
    return {
      step: "develop",
      reason: "Developer has not run yet — build or patch the site",
    };
  }

  if (state.reviewPassed === null) {
    return { step: "review", reason: "Spec ready — reviewer validates" };
  }

  const needsFix = !state.reviewPassed || state.scoreBelowThreshold;

  if (needsFix) {
    if (state.fixAttempts >= state.maxFixAttempts) {
      return {
        step: "done",
        reason: `Repair budget exhausted (${state.fixAttempts}/${state.maxFixAttempts})`,
      };
    }
    if (budgetLeft <= 0 && state.fixAttempts > 0) {
      return {
        step: "done",
        reason: "Model budget exhausted — returning best available spec",
      };
    }
    return {
      step: "fix",
      reason: !state.reviewPassed
        ? `Review failed — fixer attempt ${state.fixAttempts + 1} of ${state.maxFixAttempts}`
        : `Design score below threshold — fixer attempt ${state.fixAttempts + 1} of ${state.maxFixAttempts}`,
    };
  }

  return { step: "done", reason: "Review passed — run complete" };
}
