/**
 * Fix agent — repairs exactly what the reviewer reported.
 *
 * Cheap, well-understood failures (over-long copy, missing slots, broken
 * structure, invalid tokens) are repaired deterministically so they never cost
 * a model call. Only issues that genuinely need writing are sent to the model,
 * and its response is validated as patch operations like any other edit.
 */

import { z } from "zod";
import { SECTION_BY_ID } from "@/lib/sections/registry";
import { buildDemoSpec } from "@/lib/spec/demo-spec";
import {
  DesignTokensSchema,
  sectionKey,
  withSectionKeys,
  type DesignTokens,
  type SiteSpec,
} from "@/lib/spec/schema";
import {
  normalizeStructure,
  truncateToWords,
  validateStructure,
} from "@/lib/spec/validate";
import { readableTextOn } from "./colors";
import { agentJson, isOffline, type AgentLlmContext } from "./llm";
import { PatchOpSchema, applyPatch, type PatchOp } from "./patch";
import type { ValidationIssue } from "./types";

export type RepairResult = {
  spec: SiteSpec;
  repaired: string[];
  source: "deterministic" | "llm" | "none";
};

function cloneSpec(spec: SiteSpec): SiteSpec {
  return JSON.parse(JSON.stringify(spec)) as SiteSpec;
}

function demoContentFor(brand: string, sectionId: string) {
  const demo = buildDemoSpec(brand);
  for (const page of demo.pages) {
    const match = page.sections.find((s) => s.id === sectionId);
    if (match) return match.content;
  }
  return {};
}

function repairSection(
  spec: SiteSpec,
  key: string,
  repaired: string[],
): void {
  for (const page of spec.pages) {
    for (const [index, section] of page.sections.entries()) {
      const resolved = section.key || sectionKey(page.slug, section.id, index);
      if (resolved !== key) continue;

      const meta = SECTION_BY_ID[section.id];
      if (!meta) return;
      const fallback = demoContentFor(spec.brand, section.id);
      const content: Record<string, unknown> = { ...section.content };

      for (const [slot, slotMeta] of Object.entries(meta.slots)) {
        const value = content[slot];

        if (slotMeta.type === "text" && slotMeta.maxWords) {
          if (typeof value !== "string" || !value.trim()) {
            content[slot] = fallback[slot] ?? `${spec.brand}`;
            repaired.push(`filled ${key}.${slot}`);
          } else {
            const trimmed = truncateToWords(value, slotMeta.maxWords);
            if (trimmed !== value) {
              content[slot] = trimmed;
              repaired.push(`shortened ${key}.${slot} to ${slotMeta.maxWords} words`);
            }
          }
        }

        if (slotMeta.type === "list") {
          const min = slotMeta.minItems ?? 1;
          const max = slotMeta.maxItems ?? 10;
          const list = Array.isArray(value) ? [...value] : [];
          const source = Array.isArray(fallback[slot]) ? (fallback[slot] as unknown[]) : [];
          while (list.length < min && source.length > 0) {
            list.push(source[list.length % source.length]);
          }
          if (list.length !== (Array.isArray(value) ? value.length : -1)) {
            repaired.push(`padded ${key}.${slot}`);
          }
          if (list.length > max) {
            repaired.push(`trimmed ${key}.${slot} to ${max} items`);
          }
          content[slot] = list.slice(0, max);
        }

        if (slotMeta.type === "image" && slotMeta.query) {
          const ok =
            (typeof value === "string" && /^https:\/\//i.test(value)) ||
            (value &&
              typeof value === "object" &&
              typeof (value as { query?: unknown }).query === "string" &&
              (value as { query: string }).query.trim());
          if (!ok) {
            content[slot] = { query: `${spec.brand} ${meta.purpose}` };
            repaired.push(`reset ${key}.${slot} to an image query`);
          }
        }
      }

      page.sections[index] = { ...section, key: resolved, content };
      return;
    }
  }
}

function repairStructure(spec: SiteSpec, repaired: string[]): void {
  for (const page of spec.pages) {
    if (!validateStructure(page.sections.map((s) => s.id))) continue;

    const wanted = normalizeStructure(page.sections.map((s) => s.id));
    const byType = new Map(page.sections.map((s) => [s.id, s]));

    page.sections = wanted.map((id, index) => {
      const existing = byType.get(id);
      if (existing) {
        return { ...existing, key: sectionKey(page.slug, id, index) };
      }
      return {
        id,
        key: sectionKey(page.slug, id, index),
        content: demoContentFor(spec.brand, id),
      };
    });
    repaired.push(`rebuilt page "${page.slug}" section order`);
  }
}

function repairTokens(spec: SiteSpec, repaired: string[]): void {
  const clean = (tokens: DesignTokens | undefined, where: string) => {
    if (!tokens) return undefined;
    const next: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(tokens)) {
      const check = DesignTokensSchema.safeParse({ [name]: value });
      if (check.success) {
        next[name] = value;
      } else {
        repaired.push(`dropped invalid token ${where}.${name}`);
      }
    }
    return Object.keys(next).length > 0 ? (next as DesignTokens) : undefined;
  };

  spec.design = clean(spec.design, "design");

  // A readable button label is derivable, so fix contrast instead of reporting it.
  if (spec.design?.buttonBg && !spec.design.buttonText) {
    spec.design.buttonText = readableTextOn(spec.design.buttonBg);
  }

  for (const page of spec.pages) {
    for (const [index, section] of page.sections.entries()) {
      const key = section.key || sectionKey(page.slug, section.id, index);
      const cleaned = clean(section.tokens, key);
      if (cleaned?.buttonBg && !cleaned.buttonText) {
        cleaned.buttonText = readableTextOn(cleaned.buttonBg);
      }
      page.sections[index] = { ...section, tokens: cleaned };
    }
  }
}

/** Repairs that need no model call. Runs before every LLM fix attempt. */
export function deterministicRepair(
  spec: SiteSpec,
  issues: ValidationIssue[],
): RepairResult {
  const next = withSectionKeys(cloneSpec(spec));
  const repaired: string[] = [];

  if (issues.some((i) => i.code === "structure.invalid")) {
    repairStructure(next, repaired);
  }

  if (issues.some((i) => i.code.startsWith("token."))) {
    repairTokens(next, repaired);
  }

  // Slot and asset problems are all repairable from the section registry:
  // truncate what is too long, fill what is missing, reset broken images.
  const sectionIssues = issues.filter(
    (i) =>
      i.sectionKey &&
      (i.code === "content.slot" || i.code.startsWith("asset.")),
  );

  for (const key of new Set(sectionIssues.map((i) => i.sectionKey as string))) {
    repairSection(next, key, repaired);
  }

  if (issues.some((i) => i.code === "reference.duplicate")) {
    for (const page of next.pages) {
      page.sections = page.sections.map((section, index) => ({
        ...section,
        key: sectionKey(page.slug, section.id, index),
      }));
    }
    repaired.push("re-keyed duplicate sections");
  }

  return {
    spec: repaired.length > 0 ? next : spec,
    repaired,
    source: repaired.length > 0 ? "deterministic" : "none",
  };
}

const FixResponseSchema = z.object({
  ops: z.array(z.unknown()).max(16),
});

function fixerSystemPrompt(spec: SiteSpec): string {
  const keys = spec.pages.flatMap((page) =>
    page.sections.map(
      (section, index) =>
        `${section.key || sectionKey(page.slug, section.id, index)} (${section.id})`,
    ),
  );

  return `You are the FIX agent for Magic AI's website builder. Output STRICT JSON only.

A reviewer found problems with a generated site. Repair EXACTLY those problems and nothing else.

Sections in this site:
${keys.join("\n")}

Operation types:
{ "op": "set_slot", "sectionKey": "...", "slot": "...", "value": "new text" }
{ "op": "set_list_item", "sectionKey": "...", "slot": "items", "index": 0, "field": "title", "value": "..." }
{ "op": "set_design_token", "token": "accent|buttonBg|buttonText|surface|surfaceAlt|text|muted|primary|radius", "value": "#2563EB" }
{ "op": "set_section_token", "sectionKey": "...", "token": "...", "value": "#2563EB" }
{ "op": "set_seo", "field": "title|description", "value": "..." }

Output shape:
{ "ops": [ ... ] }

Rules:
- One operation per reported problem. Do not fix anything that was not reported.
- Copy sectionKey values exactly from the list above.
- Respect the word limits stated in each problem.
- Colours must be hex like "#2563EB".
- Return ONLY valid JSON.`;
}

export async function runFixer(input: {
  spec: SiteSpec;
  issues: ValidationIssue[];
  request: string;
  ctx: AgentLlmContext;
}): Promise<RepairResult & { ops: PatchOp[] }> {
  const repair = deterministicRepair(input.spec, input.issues);

  const remaining = input.issues.filter(
    (i) =>
      i.severity === "error" &&
      !i.code.startsWith("token.") &&
      i.code !== "structure.invalid" &&
      i.code !== "reference.duplicate",
  );
  const quality = input.issues.filter(
    (i) => i.code === "quality.judge" || i.code === "content.filler",
  );
  const needsModel = [...remaining, ...quality];

  if (needsModel.length === 0 || isOffline(input.ctx)) {
    return { ...repair, ops: [] };
  }

  const problems = needsModel
    .slice(0, 8)
    .map((i, n) => `${n + 1}. [${i.sectionKey || "site"}] ${i.message} → ${i.hint || "fix it"}`)
    .join("\n");

  const json = await agentJson(
    input.ctx,
    [
      { role: "system", content: fixerSystemPrompt(repair.spec) },
      {
        role: "user",
        content: `Original user request:\n${input.request}\n\nProblems to fix:\n${problems}`,
      },
    ],
    1400,
  );

  const envelope = json ? FixResponseSchema.safeParse(json) : null;
  if (!envelope?.success) return { ...repair, ops: [] };

  const ops: PatchOp[] = [];
  for (const raw of envelope.data.ops) {
    const parsed = PatchOpSchema.safeParse(raw);
    if (parsed.success) ops.push(parsed.data);
  }
  if (ops.length === 0) return { ...repair, ops: [] };

  const applied = applyPatch(repair.spec, ops);
  return {
    spec: applied.spec,
    repaired: [
      ...repair.repaired,
      ...applied.applied.map((op) => `model fix: ${op.op}`),
    ],
    source: applied.applied.length > 0 ? "llm" : repair.source,
    ops: applied.applied,
  };
}
