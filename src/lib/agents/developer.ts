/**
 * Developer agent — turns a plan into concrete edits.
 *
 * For generation it delegates to the existing spec pipeline. For refinement it
 * emits patch operations scoped to the sections and tokens the planner
 * resolved, so an edit can never silently rewrite the rest of the site.
 */

import { z } from "zod";
import { SECTION_BY_ID } from "@/lib/sections/registry";
import { runSpecPipeline } from "@/lib/spec/pipeline";
import { demoContentForSection } from "@/lib/spec/demo-spec";
import {
  SectionIdSchema,
  withSectionKeys,
  type SectionId,
  type SiteSpec,
} from "@/lib/spec/schema";
import { blueprintDigest, type WebsiteBlueprint } from "./designer";
import { agentJson, isOffline, type AgentLlmContext } from "./llm";
import { allSections, memoryDigest, type ProjectMemoryModel } from "./memory";
import { PatchOpSchema, applyPatch, type PatchOp } from "./patch";
import type { AgentPlan, ResolvedTarget } from "./types";

export type DeveloperResult = {
  spec: SiteSpec;
  ops: PatchOp[];
  rejected: { op: PatchOp; reason: string }[];
  source: "deterministic" | "llm" | "none";
};

const PatchResponseSchema = z.object({
  ops: z.array(z.unknown()).max(24),
});

/**
 * Targets that already carry a value can be turned into operations directly —
 * this is the path "change the button color to blue" takes.
 */
function opsFromTargets(targets: ResolvedTarget[]): PatchOp[] {
  const ops: PatchOp[] = [];
  for (const target of targets) {
    if (target.kind === "design_token" && target.value) {
      ops.push({
        op: "set_design_token",
        token: target.token,
        value: target.value,
      });
    }
    if (target.kind === "section_token" && target.value) {
      ops.push({
        op: "set_section_token",
        sectionKey: target.sectionKey,
        token: target.token,
        value: target.value,
      });
    }
    if (target.kind === "add_section") {
      const parsed = SectionIdSchema.safeParse(target.sectionId);
      if (parsed.success) {
        ops.push({
          op: "add_section",
          pageSlug: target.pageSlug,
          sectionId: parsed.data as SectionId,
        });
      }
    }
  }
  return ops;
}

function allowedScope(plan: AgentPlan): {
  sectionKeys: Set<string>;
  tokens: Set<string>;
  unrestricted: boolean;
} {
  const sectionKeys = new Set<string>();
  const tokens = new Set<string>();
  let unrestricted = plan.targets.length === 0;

  for (const target of plan.targets) {
    if (target.kind === "site") unrestricted = true;
    if ("sectionKey" in target) sectionKeys.add(target.sectionKey);
    if ("token" in target) tokens.add(target.token as string);
  }

  return { sectionKeys, tokens, unrestricted };
}

/** Drop anything the model produced that falls outside the planned scope. */
function filterToScope(
  ops: PatchOp[],
  plan: AgentPlan,
): { kept: PatchOp[]; dropped: { op: PatchOp; reason: string }[] } {
  const scope = allowedScope(plan);
  if (scope.unrestricted) return { kept: ops, dropped: [] };

  const kept: PatchOp[] = [];
  const dropped: { op: PatchOp; reason: string }[] = [];

  for (const op of ops) {
    const key = "sectionKey" in op ? op.sectionKey : null;
    if (key && !scope.sectionKeys.has(key)) {
      dropped.push({ op, reason: `${key} is outside the planned scope` });
      continue;
    }
    if (op.op === "set_design_token" && scope.tokens.size > 0 && !scope.tokens.has(op.token)) {
      dropped.push({ op, reason: `token ${op.token} is outside the planned scope` });
      continue;
    }
    kept.push(op);
  }

  return { kept, dropped };
}

function slotDocsFor(memory: ProjectMemoryModel, keys: Set<string>): string {
  const sections = allSections(memory).filter(
    (s) => keys.size === 0 || keys.has(s.key),
  );
  return sections
    .map((section) => {
      const meta = SECTION_BY_ID[section.type];
      const slots = section.components
        .map((component) => {
          const slot = meta?.slots?.[component.slot];
          const limit =
            slot?.type === "text" && slot.maxWords
              ? ` (max ${slot.maxWords} words)`
              : slot?.type === "list"
                ? ` (${slot.minItems ?? 1}–${slot.maxItems ?? 6} items)`
                : slot?.type === "image"
                  ? ` ({ "query": "search terms" })`
                  : "";
          return `    ${component.slot}: ${component.kind}${limit} — current: ${component.value.slice(0, 80)}`;
        })
        .join("\n");
      return `- ${section.key} (${section.type}):\n${slots}`;
    })
    .join("\n");
}

function developerSystemPrompt(
  memory: ProjectMemoryModel,
  plan: AgentPlan,
): string {
  const scope = allowedScope(plan);
  return `You are the DEVELOPER agent for Magic AI's website builder. Output STRICT JSON only.

You apply a change request as a minimal list of patch operations against an existing site.

Site inventory:
${memoryDigest(memory)}

Sections you may edit:
${slotDocsFor(memory, scope.sectionKeys) || "(none — use design tokens)"}

Operation types:
{ "op": "set_slot", "sectionKey": "...", "slot": "...", "value": "new text" }
{ "op": "set_list_item", "sectionKey": "...", "slot": "items", "index": 0, "field": "title", "value": "..." }
{ "op": "set_design_token", "token": "accent|buttonBg|buttonText|surface|surfaceAlt|text|muted|primary|radius|displayFont|bodyFont", "value": "#2563EB" }
{ "op": "set_section_token", "sectionKey": "...", "token": "...", "value": "#2563EB" }
{ "op": "set_seo", "field": "title|description", "value": "..." }
{ "op": "add_section", "pageSlug": "home", "sectionId": "pricing_3tier", "index": 4, "content": { ... } }
{ "op": "remove_section", "sectionKey": "..." }
{ "op": "move_section", "sectionKey": "...", "index": 2 }

Output shape:
{ "ops": [ ... ] }

Rules:
- Emit the FEWEST operations that satisfy the request. Do not touch anything else.
- sectionKey values MUST be copied exactly from the inventory above.
- Colour values MUST be hex like "#2563EB". Never use colour names or rgb().
- Respect the word and item limits shown for each slot.
- Keep the client's real business name, city and offer — never replace them with placeholders.
- Return ONLY valid JSON.`;
}

function opsFromTargetsWithContent(
  targets: ResolvedTarget[],
  brand: string,
): PatchOp[] {
  return opsFromTargets(targets).map((op) => {
    if (op.op !== "add_section" || op.content) return op;
    return {
      ...op,
      content: demoContentForSection(op.sectionId, brand, brand),
    };
  });
}

export async function runDeveloperPatch(input: {
  request: string;
  spec: SiteSpec;
  memory: ProjectMemoryModel;
  plan: AgentPlan;
  ctx: AgentLlmContext;
}): Promise<DeveloperResult> {
  const deterministic = opsFromTargetsWithContent(
    input.plan.targets,
    input.memory.brand,
  );

  if (deterministic.length > 0) {
    const result = applyPatch(input.spec, deterministic);
    return {
      spec: result.spec,
      ops: result.applied,
      rejected: result.rejected,
      source: "deterministic",
    };
  }

  if (isOffline(input.ctx)) {
    return { spec: input.spec, ops: [], rejected: [], source: "none" };
  }

  const json = await agentJson(
    input.ctx,
    [
      {
        role: "system",
        content: developerSystemPrompt(input.memory, input.plan),
      },
      {
        role: "user",
        content: `Change request:\n${input.request}\n\nPlanned change:\n${input.plan.summary}\n${input.plan.steps.join("\n")}`,
      },
    ],
    1800,
  );

  const envelope = json ? PatchResponseSchema.safeParse(json) : null;
  if (!envelope?.success) {
    return { spec: input.spec, ops: [], rejected: [], source: "none" };
  }

  const parsedOps: PatchOp[] = [];
  const rejected: { op: PatchOp; reason: string }[] = [];
  for (const raw of envelope.data.ops) {
    const op = PatchOpSchema.safeParse(raw);
    if (op.success) parsedOps.push(op.data);
  }

  const { kept, dropped } = filterToScope(parsedOps, input.plan);
  rejected.push(...dropped);

  if (kept.length === 0) {
    return { spec: input.spec, ops: [], rejected, source: "none" };
  }

  const result = applyPatch(input.spec, kept);
  return {
    spec: result.spec,
    ops: result.applied,
    rejected: [...rejected, ...result.rejected],
    source: "llm",
  };
}

export async function runDeveloperGenerate(input: {
  prompt: string;
  provider: Parameters<typeof runSpecPipeline>[0]["provider"];
  theme?: string | null;
  uiKit?: string | null;
  model?: string | null;
  blueprint?: WebsiteBlueprint | null;
}): Promise<SiteSpec> {
  const result = await runSpecPipeline({
    prompt: input.prompt,
    provider: input.provider,
    theme: input.theme || input.blueprint?.theme || null,
    uiKit: input.uiKit,
    model: input.model,
    blueprint: input.blueprint
      ? {
          theme: input.blueprint.theme,
          sections: input.blueprint.sections,
          design: input.blueprint.design,
          digest: blueprintDigest(input.blueprint),
        }
      : null,
  });
  return withSectionKeys(result.spec);
}
