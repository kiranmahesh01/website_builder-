/**
 * Shared vocabulary for the multi-agent loop.
 *
 * This module is import-safe from client components: it pulls in nothing but
 * types and plain constants, so `AgentProgress` can render events without
 * dragging Prisma or react-dom/server into the browser bundle.
 */

import type { DesignTokens } from "@/lib/spec/schema";

export const AGENT_ROLES = [
  "planner",
  "developer",
  "reviewer",
  "fixer",
  "orchestrator",
] as const;

export type AgentRole = (typeof AGENT_ROLES)[number];

export const AGENT_ROLE_LABELS: Record<AgentRole, string> = {
  planner: "Planner",
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

export type ReviewReport = {
  passed: boolean;
  issues: ValidationIssue[];
  checks: ReviewCheck[];
  /** Populated by the render smoke test so callers can reuse the output. */
  html?: string;
};

export type TargetProperty =
  | "color"
  | "text"
  | "image"
  | "radius"
  | "font"
  | "layout";

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
};

export const AGENT_BUDGET = {
  /** Review passes after the first one. 2 → at most 3 reviews per run. */
  maxFixAttempts: 2,
  /** Hard ceiling on model calls per run so a bad request cannot drain the free tier. */
  maxLlmCalls: 8,
} as const;
