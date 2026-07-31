/**
 * Planner agent — decomposes a user request against project memory.
 *
 * It always produces a deterministic plan first by resolving the request
 * against the memory index. The model is only consulted when that resolution is
 * ambiguous, which keeps confident requests ("make the buttons blue") free.
 */

import { z } from "zod";
import { DesignTokensSchema, type DesignTokens } from "@/lib/spec/schema";
import { agentJson, isOffline, type AgentLlmContext } from "./llm";
import {
  addableSectionTypes,
  allSections,
  memoryDigest,
  resolveTargets,
  type ProjectMemoryModel,
} from "./memory";
import type { AgentPlan, ResolvedTarget, TargetResolution } from "./types";

const TOKEN_NAMES = Object.keys(DesignTokensSchema.shape);

const PlanResponseSchema = z.object({
  intent: z.enum(["patch", "regenerate", "unknown"]).default("patch"),
  summary: z.string().min(1).max(300),
  steps: z.array(z.string().min(1).max(200)).max(6).default([]),
  targets: z
    .array(
      z.object({
        sectionKey: z.string().optional(),
        slot: z.string().optional(),
        token: z.string().optional(),
      }),
    )
    .max(12)
    .default([]),
});

function plannerSystemPrompt(memory: ProjectMemoryModel): string {
  return `You are the PLANNER agent for Magic AI's website builder. Output STRICT JSON only.

You do not write copy or design. You decide WHERE in an existing site a change request applies.

The site you are editing:
${memoryDigest(memory)}

Addressable things:
- Section keys: exactly the keys listed above (e.g. "home.hero_split#0").
- Slots: the slot names listed after each section key.
- Design tokens (site-wide styling): ${TOKEN_NAMES.join(", ")}
- Section types that may be added: ${addableSectionTypes().join(", ")}

Output shape:
{
  "intent": "patch" | "regenerate" | "unknown",
  "summary": "One sentence describing the change",
  "steps": ["Short imperative step", "..."],
  "targets": [{ "sectionKey": "home.hero_split#0", "slot": "headline" }, { "token": "buttonBg" }]
}

Rules:
- Prefer "patch". Use "regenerate" ONLY when the user asks for a different business, a different site, or a full rewrite.
- Every sectionKey MUST be copied exactly from the list above. Never invent one.
- Colour, font and corner-rounding changes are design tokens, not slots.
- If the request names no section, target the design token or leave targets empty.
- Return ONLY valid JSON.`;
}

function deterministicPlan(
  request: string,
  resolution: TargetResolution,
): AgentPlan {
  const intent = /\b(start over|completely different|rebuild|regenerate|new website|different business)\b/i.test(
    request,
  )
    ? "regenerate"
    : "patch";

  return {
    intent,
    summary:
      resolution.confidence === "high"
        ? `Apply "${request}" to ${resolution.targets.map((t) => t.label).join(", ")}`
        : `Apply "${request}"`,
    targets: resolution.targets,
    steps: [resolution.reason],
    confidence: resolution.confidence,
    source: "deterministic",
  };
}

function mergeLlmTargets(
  memory: ProjectMemoryModel,
  raw: z.infer<typeof PlanResponseSchema>,
): ResolvedTarget[] {
  const sections = allSections(memory);
  const targets: ResolvedTarget[] = [];

  for (const target of raw.targets) {
    if (target.token && TOKEN_NAMES.includes(target.token)) {
      const token = target.token as keyof DesignTokens;
      if (target.sectionKey && sections.some((s) => s.key === target.sectionKey)) {
        targets.push({
          kind: "section_token",
          sectionKey: target.sectionKey,
          token,
          label: `${target.sectionKey} ${target.token}`,
        });
      } else {
        targets.push({
          kind: "design_token",
          token,
          label: `site ${target.token}`,
        });
      }
      continue;
    }

    if (!target.sectionKey) continue;
    const section = sections.find((s) => s.key === target.sectionKey);
    if (!section) continue;

    if (target.slot && section.components.some((c) => c.slot === target.slot)) {
      targets.push({
        kind: "slot",
        sectionKey: section.key,
        slot: target.slot,
        label: `${section.key}.${target.slot}`,
      });
    } else {
      targets.push({
        kind: "section",
        sectionKey: section.key,
        label: section.type,
      });
    }
  }

  return targets;
}

export async function runPlanner(input: {
  request: string;
  memory: ProjectMemoryModel;
  ctx: AgentLlmContext;
}): Promise<AgentPlan> {
  const resolution = resolveTargets(input.memory, input.request);
  const fallback = deterministicPlan(input.request, resolution);

  // A confident deterministic match needs no model call at all.
  if (resolution.confidence === "high" || isOffline(input.ctx)) {
    return fallback;
  }

  const json = await agentJson(
    input.ctx,
    [
      { role: "system", content: plannerSystemPrompt(input.memory) },
      { role: "user", content: `Change request:\n${input.request}` },
    ],
    600,
  );

  const parsed = json ? PlanResponseSchema.safeParse(json) : null;
  if (!parsed?.success) return fallback;

  const targets = mergeLlmTargets(input.memory, parsed.data);
  return {
    intent: parsed.data.intent,
    summary: parsed.data.summary,
    targets: targets.length > 0 ? targets : resolution.targets,
    steps: parsed.data.steps.length > 0 ? parsed.data.steps : fallback.steps,
    confidence: targets.length > 0 ? "medium" : resolution.confidence,
    source: "llm",
  };
}

export { resolveTargets };
