/**
 * Prisma persistence for project memory and the append-only change log.
 * Server-only: never import this from a client component.
 */

import { prisma } from "@/lib/db";
import { DesignTokensSchema, type SiteSpec } from "@/lib/spec/schema";
import type { AgentEvent, AgentPlan, ReviewReport } from "./types";
import type { PatchOp } from "./patch";
import { buildMemory, memoryDigest, type ProjectMemoryModel } from "./memory";

function safeJson(value: unknown): string | undefined {
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

/**
 * Rewrite the memory tree for a project from its current spec.
 *
 * Sites are small — one or two pages, at most nine sections — so deleting and
 * rebuilding inside a transaction is simpler and safer than diffing rows.
 */
export async function saveProjectMemory(
  projectId: string,
  spec: SiteSpec,
): Promise<ProjectMemoryModel> {
  const existing = await prisma.projectMemory.findUnique({
    where: { projectId },
    select: { id: true, revision: true },
  });

  const revision = (existing?.revision ?? 0) + 1;
  const memory = buildMemory(spec, revision);
  const fields = {
    brand: memory.brand,
    theme: memory.theme,
    designTokens: safeJson(memory.design),
    digest: memoryDigest(memory),
    revision,
  };

  await prisma.$transaction(
    async (tx) => {
      let memoryId: string;
      if (existing) {
        await tx.memoryPage.deleteMany({ where: { memoryId: existing.id } });
        await tx.projectMemory.update({
          where: { id: existing.id },
          data: fields,
        });
        memoryId = existing.id;
      } else {
        const created = await tx.projectMemory.create({
          data: { projectId, ...fields },
          select: { id: true },
        });
        memoryId = created.id;
      }

      for (const [pageIndex, page] of memory.pages.entries()) {
        const pageRow = await tx.memoryPage.create({
          data: {
            memoryId,
            slug: page.slug,
            title: page.title,
            order: pageIndex,
          },
          select: { id: true },
        });

        for (const section of page.sections) {
          const sectionRow = await tx.memorySection.create({
            data: {
              pageId: pageRow.id,
              key: section.key,
              type: section.type,
              order: section.index,
              tokens: section.tokens ? safeJson(section.tokens) : null,
            },
            select: { id: true },
          });

          if (section.components.length === 0) continue;
          await tx.memoryComponent.createMany({
            data: section.components.map((component, order) => ({
              memorySectionId: sectionRow.id,
              key: component.key,
              slot: component.slot,
              kind: component.kind,
              value: component.value.slice(0, 500),
              order,
            })),
          });
        }
      }
    },
    { timeout: 20_000, maxWait: 10_000 },
  );

  return memory;
}

/**
 * Rebuild the memory model for a project. The spec is the source of truth for
 * structure and tokens; stored rows supply the revision counter and act as a
 * fallback for specs saved before design tokens existed.
 */
export async function loadProjectMemory(
  projectId: string,
  spec: SiteSpec,
): Promise<ProjectMemoryModel> {
  const record = await prisma.projectMemory.findUnique({
    where: { projectId },
    select: { revision: true, designTokens: true },
  });

  if (!record) return buildMemory(spec);

  const specHasTokens = Object.keys(spec.design || {}).length > 0;
  if (!specHasTokens && record.designTokens) {
    try {
      const parsed = DesignTokensSchema.safeParse(
        JSON.parse(record.designTokens),
      );
      if (parsed.success && Object.keys(parsed.data).length > 0) {
        return buildMemory({ ...spec, design: parsed.data }, record.revision);
      }
    } catch {
      // Unreadable stored tokens — the spec still describes the site.
    }
  }

  return buildMemory(spec, record.revision);
}

export async function recentChanges(projectId: string, take = 8) {
  return prisma.projectChange.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take,
    select: { request: true, summary: true, createdAt: true },
  });
}

/**
 * Write memory + change log for a finished run.
 *
 * Deliberately swallows its own errors: if the memory tables have not been
 * migrated yet, generation and refinement must still work. The next run simply
 * rebuilds memory from the spec.
 */
export async function persistAgentRun(input: {
  projectId: string;
  kind: "generate" | "refine";
  request: string;
  result: {
    spec: SiteSpec;
    summary: string;
    passed: boolean;
    changed: boolean;
    attempts: number;
    plan: AgentPlan | null;
    ops: PatchOp[];
    review: ReviewReport;
    events: AgentEvent[];
  };
  versionId?: string | null;
}): Promise<{ persisted: boolean }> {
  try {
    await saveProjectMemory(input.projectId, input.result.spec);
    await recordProjectChange({
      projectId: input.projectId,
      kind: input.kind,
      request: input.request,
      summary: input.result.summary,
      status: input.result.changed
        ? input.result.passed
          ? "applied"
          : "failed"
        : "no_op",
      passed: input.result.passed,
      attempts: input.result.attempts,
      plan: input.result.plan,
      ops: input.result.ops,
      review: input.result.review,
      events: input.result.events,
      versionId: input.versionId,
    });
    return { persisted: true };
  } catch (error) {
    console.warn(
      "project memory not persisted — run the migration in prisma/migrations-manual",
      error instanceof Error ? error.message : error,
    );
    return { persisted: false };
  }
}

export async function recordProjectChange(input: {
  projectId: string;
  kind: "generate" | "refine";
  request: string;
  summary: string;
  status: "applied" | "no_op" | "failed";
  passed: boolean;
  attempts: number;
  plan?: AgentPlan | null;
  ops?: PatchOp[] | null;
  review?: ReviewReport | null;
  events?: AgentEvent[] | null;
  versionId?: string | null;
}) {
  return prisma.projectChange.create({
    data: {
      projectId: input.projectId,
      kind: input.kind,
      request: input.request.slice(0, 4000),
      summary: input.summary.slice(0, 1000),
      status: input.status,
      passed: input.passed,
      attempts: input.attempts,
      plan: input.plan ? safeJson(input.plan) : null,
      patch: input.ops?.length ? safeJson(input.ops) : null,
      issues: input.review?.issues.length ? safeJson(input.review.issues) : null,
      trace: input.events?.length ? safeJson(input.events) : null,
      versionId: input.versionId ?? null,
    },
    select: { id: true },
  });
}
