/**
 * Shared vocabulary for the multi-agent loop.
 *
 * This module is import-safe from client components: it pulls in nothing but
 * types and plain constants, so `AgentProgress` can render events without
 * dragging Prisma or react-dom/server into the browser bundle.
 */

import type { DesignTokens } from "@/lib/spec/schema";

export const AGENT_ROLES = [
  "manager",
  "planner",
  "designer",
  "developer",
  "reviewer",
  "fixer",
  "orchestrator",
] as const;

export type AgentRole = (typeof AGENT_ROLES)[number];

export const AGENT_ROLE_LABELS: Record<AgentRole, string> = {
  manager: "Manager",
  planner: "Planner",
  designer: "Designer",
  developer: "Developer",
  reviewer: "Reviewer",
  fixer: "Fix agent",
  orchestrator: "Orchestrator",
};

export type AgentEventType =
  | "start"
  | "progress"
  | "pass"
  | "fail"
  | "retry"
  | "done"
  | "error";

export type AgentEvent = {
  role: AgentRole;
  type: AgentEventType;
  message: string;
  attempt?: number;
  at: number;
};

export type IssueSeverity = "error" | "warning";

/**
 * A single reviewer finding. `code` is stable so the fix agent can decide
 * between a deterministic repair and asking the model.
 */
export type ValidationIssue = {
  code: string;
  severity: IssueSeverity;
  message: string;
  path?: string;
  sectionKey?: string;
  slot?: string;
  /** Concrete instruction handed to the fix agent. */
  hint?: string;
};

export type ReviewCheck = {
  name: string;
  passed: boolean;
  detail?: string;
};

export type QualityScores = {
  design: number;
  mobile: number;
  seo: number;
  performance: number;
  overall: number;
  /** Magic Score extensions */
  ux?: number;
  conversion?: number;
  accessibility?: number;
};

export type ReviewReport = {
  passed: boolean;
  /** Design / quality score 0–100 (deterministic rubric). */
  score: number;
  /** Multi-dimension breakdown for the Website Critic UI. */
  scores?: QualityScores;
  issues: ValidationIssue[];
  checks: ReviewCheck[];
  /** Populated by the render smoke test so callers can reuse the output. */
  html?: string;
};

/** Fixer runs when review fails OR score falls below this threshold. */
export const DESIGN_SCORE_THRESHOLD = 70;

export type TargetProperty =
  | "color"
  | "text"
  | "image"
  | "radius"
  | "font"
  | "layout"
  | "size"
  | "structure";

/** Where in the site a request resolves to. */
export type ResolvedTarget =
  | {
      kind: "design_token";
      token: keyof DesignTokens;
      value?: string;
      label: string;
    }
  | {
      kind: "section_token";
      sectionKey: string;
      token: keyof DesignTokens;
      value?: string;
      label: string;
    }
  | {
      kind: "slot";
      sectionKey: string;
      slot: string;
      value?: string;
      label: string;
    }
  | { kind: "section"; sectionKey: string; label: string }
  | {
      kind: "add_section";
      sectionId: string;
      pageSlug: string;
      label: string;
    }
  | { kind: "site"; label: string };

export type TargetResolution = {
  targets: ResolvedTarget[];
  confidence: "high" | "medium" | "low";
  property: TargetProperty | null;
  /** Set when the request named a colour we could map to a hex value. */
  color?: string;
  reason: string;
};

export type AgentPlanIntent = "patch" | "regenerate" | "unknown";

export type AgentPlan = {
  intent: AgentPlanIntent;
  summary: string;
  targets: ResolvedTarget[];
  steps: string[];
  confidence: TargetResolution["confidence"];
  source: "deterministic" | "llm";
  /** Industry inferred from the KB during generate planning. */
  industry?: string;
  /** Template ids the planner/retriever selected. */
  templateIds?: string[];
};

export const AGENT_BUDGET = {
  /** Review passes after the first one. 2 → at most 3 reviews per run. */
  maxFixAttempts: 2,
  /**
   * Hard ceiling on agent-layer model calls (planner/designer/fixer/judge).
   * Spec pipeline plan/structure/content calls are separate and already
   * shortened when a blueprint supplies theme + sections.
   */
  maxLlmCalls: 6,
} as const;
