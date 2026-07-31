/**
 * The only vocabulary agents may use to change a site.
 *
 * Every edit is an explicit, validated operation against a stable section key,
 * which is what makes a refinement targeted instead of a full regeneration.
 */

import { z } from "zod";
import { SITE_THEMES } from "@/lib/themes";
import {
  DesignTokensSchema,
  SectionIdSchema,
  SiteSpecSchema,
  sectionKey,
  withSectionKeys,
  type DesignTokens,
  type SiteSpec,
} from "@/lib/spec/schema";

const TokenNameSchema = z.enum(
  Object.keys(DesignTokensSchema.shape) as [string, ...string[]],
);

export const PatchOpSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("set_design_token"),
    token: TokenNameSchema,
    value: z.string(),
  }),
  z.object({
    op: z.literal("set_section_token"),
    sectionKey: z.string().min(1),
    token: TokenNameSchema,
    value: z.string(),
  }),
  z.object({
    op: z.literal("set_slot"),
    sectionKey: z.string().min(1),
    slot: z.string().min(1),
    value: z.unknown(),
  }),
  z.object({
    op: z.literal("set_list_item"),
    sectionKey: z.string().min(1),
    slot: z.string().min(1),
    index: z.number().int().min(0).max(19),
    field: z.string().min(1),
    value: z.string(),
  }),
  z.object({ op: z.literal("set_brand"), value: z.string().min(1) }),
  z.object({
    op: z.literal("set_seo"),
    field: z.enum(["title", "description"]),
    value: z.string().min(1),
  }),
  z.object({ op: z.literal("set_theme"), value: z.enum(SITE_THEMES) }),
  z.object({
    op: z.literal("add_section"),
    pageSlug: z.string().min(1),
    sectionId: SectionIdSchema,
    index: z.number().int().min(0).max(9).optional(),
    content: z.record(z.string(), z.unknown()).optional(),
  }),
  z.object({ op: z.literal("remove_section"), sectionKey: z.string().min(1) }),
  z.object({
    op: z.literal("move_section"),
    sectionKey: z.string().min(1),
    index: z.number().int().min(0).max(9),
  }),
]);

export type PatchOp = z.infer<typeof PatchOpSchema>;

export const PatchSchema = z.object({
  ops: z.array(PatchOpSchema).min(1).max(24),
});

export type ApplyPatchResult = {
  spec: SiteSpec;
  applied: PatchOp[];
  rejected: { op: PatchOp; reason: string }[];
};

function cloneSpec(spec: SiteSpec): SiteSpec {
  return JSON.parse(JSON.stringify(spec)) as SiteSpec;
}

function locate(spec: SiteSpec, key: string) {
  for (let p = 0; p < spec.pages.length; p++) {
    const page = spec.pages[p];
    for (let s = 0; s < page.sections.length; s++) {
      const section = page.sections[s];
      const resolvedKey = section.key || sectionKey(page.slug, section.id, s);
      if (resolvedKey === key) return { pageIndex: p, sectionIndex: s };
    }
  }
  return null;
}

function validateTokenValue(
  token: string,
  value: string,
): { ok: true; token: keyof DesignTokens } | { ok: false; reason: string } {
  const result = DesignTokensSchema.safeParse({ [token]: value });
  if (!result.success) {
    return {
      ok: false,
      reason: result.error.issues[0]?.message || `Invalid value for ${token}`,
    };
  }
  return { ok: true, token: token as keyof DesignTokens };
}

/**
 * Apply operations one at a time. An op that cannot be applied is rejected with
 * a reason instead of corrupting the spec, so a partially-wrong model response
 * still produces a valid site.
 */
export function applyPatch(spec: SiteSpec, ops: PatchOp[]): ApplyPatchResult {
  const next = withSectionKeys(cloneSpec(spec));
  const applied: PatchOp[] = [];
  const rejected: { op: PatchOp; reason: string }[] = [];

  for (const op of ops) {
    switch (op.op) {
      case "set_design_token": {
        const check = validateTokenValue(op.token, op.value);
        if (!check.ok) {
          rejected.push({ op, reason: check.reason });
          break;
        }
        next.design = { ...(next.design || {}), [check.token]: op.value };
        applied.push(op);
        break;
      }

      case "set_section_token": {
        const at = locate(next, op.sectionKey);
        if (!at) {
          rejected.push({ op, reason: `Unknown section ${op.sectionKey}` });
          break;
        }
        const check = validateTokenValue(op.token, op.value);
        if (!check.ok) {
          rejected.push({ op, reason: check.reason });
          break;
        }
        const section = next.pages[at.pageIndex].sections[at.sectionIndex];
        section.tokens = { ...(section.tokens || {}), [check.token]: op.value };
        applied.push(op);
        break;
      }

      case "set_slot": {
        const at = locate(next, op.sectionKey);
        if (!at) {
          rejected.push({ op, reason: `Unknown section ${op.sectionKey}` });
          break;
        }
        const section = next.pages[at.pageIndex].sections[at.sectionIndex];
        section.content = { ...section.content, [op.slot]: op.value };
        applied.push(op);
        break;
      }

      case "set_list_item": {
        const at = locate(next, op.sectionKey);
        if (!at) {
          rejected.push({ op, reason: `Unknown section ${op.sectionKey}` });
          break;
        }
        const section = next.pages[at.pageIndex].sections[at.sectionIndex];
        const list = section.content[op.slot];
        if (!Array.isArray(list) || !list[op.index]) {
          rejected.push({
            op,
            reason: `${op.slot}[${op.index}] does not exist`,
          });
          break;
        }
        const items = [...list];
        const item = items[op.index];
        items[op.index] =
          item && typeof item === "object"
            ? { ...(item as Record<string, unknown>), [op.field]: op.value }
            : op.value;
        section.content = { ...section.content, [op.slot]: items };
        applied.push(op);
        break;
      }

      case "set_brand":
        next.brand = op.value;
        applied.push(op);
        break;

      case "set_seo":
        next.seo = {
          title: next.seo?.title || next.brand,
          description: next.seo?.description || "",
          [op.field]: op.value,
        };
        applied.push(op);
        break;

      case "set_theme":
        next.theme = op.value;
        applied.push(op);
        break;

      case "add_section": {
        const pageIndex = next.pages.findIndex((p) => p.slug === op.pageSlug);
        if (pageIndex < 0) {
          rejected.push({ op, reason: `Unknown page ${op.pageSlug}` });
          break;
        }
        const page = next.pages[pageIndex];
        if (page.sections.length >= 9) {
          rejected.push({ op, reason: "Page already has the maximum 9 sections" });
          break;
        }
        const at = Math.min(
          op.index ?? Math.max(page.sections.length - 1, 0),
          page.sections.length,
        );
        page.sections.splice(at, 0, {
          id: op.sectionId,
          key: sectionKey(page.slug, op.sectionId, page.sections.length),
          content: op.content || {},
        });
        applied.push(op);
        break;
      }

      case "remove_section": {
        const at = locate(next, op.sectionKey);
        if (!at) {
          rejected.push({ op, reason: `Unknown section ${op.sectionKey}` });
          break;
        }
        const page = next.pages[at.pageIndex];
        if (page.sections.length <= 5) {
          rejected.push({ op, reason: "A page must keep at least 5 sections" });
          break;
        }
        page.sections.splice(at.sectionIndex, 1);
        applied.push(op);
        break;
      }

      case "move_section": {
        const at = locate(next, op.sectionKey);
        if (!at) {
          rejected.push({ op, reason: `Unknown section ${op.sectionKey}` });
          break;
        }
        const page = next.pages[at.pageIndex];
        const [section] = page.sections.splice(at.sectionIndex, 1);
        page.sections.splice(
          Math.min(op.index, page.sections.length),
          0,
          section,
        );
        applied.push(op);
        break;
      }
    }
  }

  const parsed = SiteSpecSchema.safeParse(next);
  if (!parsed.success) {
    return {
      spec,
      applied: [],
      rejected: ops.map((op) => ({
        op,
        reason: `Patch produced an invalid spec: ${parsed.error.issues[0]?.message}`,
      })),
    };
  }

  return { spec: parsed.data, applied, rejected };
}

export function describeOp(op: PatchOp): string {
  switch (op.op) {
    case "set_design_token":
      return `site ${op.token} → ${op.value}`;
    case "set_section_token":
      return `${op.sectionKey} ${op.token} → ${op.value}`;
    case "set_slot":
      return `${op.sectionKey}.${op.slot} updated`;
    case "set_list_item":
      return `${op.sectionKey}.${op.slot}[${op.index}].${op.field} updated`;
    case "set_brand":
      return `brand → ${op.value}`;
    case "set_seo":
      return `SEO ${op.field} updated`;
    case "set_theme":
      return `theme → ${op.value}`;
    case "add_section":
      return `added ${op.sectionId} to ${op.pageSlug}`;
    case "remove_section":
      return `removed ${op.sectionKey}`;
    case "move_section":
      return `moved ${op.sectionKey} to position ${op.index}`;
  }
}
