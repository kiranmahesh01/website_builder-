import { z } from "zod";
import { runAgentLoop } from "@/lib/agents";
import { buildMemory } from "@/lib/agents/memory";
import { loadProjectMemory, persistAgentRun } from "@/lib/agents/memory-store";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { resolveModel } from "@/lib/llm/resolve-model";
import { resolveProvider } from "@/lib/llm/types";
import {
  deserializeProjectData,
  serializeProjectData,
} from "@/lib/site-data";
import { snapshotProjectVersion } from "@/lib/versions";
import type { AgentEvent } from "@/lib/agents/types";

export const maxDuration = 120;
export const runtime = "nodejs";

const schema = z.object({
  projectId: z.string().min(1),
  message: z.string().min(1).max(4000),
  provider: z
    .enum(["nvidia", "openai", "gemini", "bytez", "openrouter", "openrouter-best", "demo"])
    .optional(),
  model: z.string().max(120).optional(),
});

type StreamChunk =
  | { type: "event"; event: AgentEvent }
  | { type: "result"; project: unknown; messages: unknown; passed: boolean }
  | { type: "error"; error: string };

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Streams the agent loop as newline-delimited JSON so the builder can show
 * which agent is running and whether validation is retrying.
 *
 * Scoped edits resolve via project memory + deterministic patches
 * ("make this button bigger", "darker hero", "add pricing") before any model call.
 *
 * Vision / screenshot targeting is optional: when OPENROUTER_API_KEY is set and
 * a vision-capable model is selected, a future client can attach an image; the
 * default path does not require vision keys and never blocks on them.
 *
 * Auth and the project read happen before the stream opens; everything after
 * that is streamed, including failures, so the client always sees a terminal
 * chunk.
 */
export async function POST(request: Request) {
  const session = await requireUserId();
  if (!session.ok) {
    return jsonResponse({ error: session.error }, session.status);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request" }, 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid request" }, 400);
  }

  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, userId: session.userId },
  });
  if (!project) {
    return jsonResponse({ error: "Project not found" }, 404);
  }

  const existing = deserializeProjectData(project.data);
  if (!existing) {
    return jsonResponse(
      { error: "This project predates the agent pipeline — regenerate it first." },
      409,
    );
  }

  const provider = resolveProvider(parsed.data.provider);
  const model = resolveModel(provider, parsed.data.model, project.model);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: StreamChunk) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(chunk)}\n`));
      };

      try {
        const memory = await loadProjectMemory(project.id, existing.spec).catch(
          () => buildMemory(existing.spec),
        );

        const run = await runAgentLoop({
          mode: "refine",
          request: parsed.data.message,
          provider,
          model,
          spec: existing.spec,
          memory,
          onEvent: (event) => send({ type: "event", event }),
        });

        const reply = run.changed
          ? `Updated: ${run.summary}`
          : 'I could not pin that change to a specific part of the site — try naming the section, e.g. "make the hero button blue".';

        await snapshotProjectVersion(project.id, "Before refine");
        await persistAgentRun({
          projectId: project.id,
          kind: "refine",
          request: parsed.data.message,
          result: run,
        });

        const updated = await prisma.project.update({
          where: { id: project.id },
          data: {
            html: run.html,
            data: serializeProjectData({ spec: run.spec, website: run.website }),
            provider,
            model,
            messages: {
              create: [
                { role: "user", content: parsed.data.message },
                { role: "assistant", content: reply },
              ],
            },
          },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        });

        send({
          type: "result",
          passed: run.passed,
          project: {
            id: updated.id,
            title: updated.title,
            html: updated.html,
            data: updated.data,
            provider: updated.provider,
            published: updated.published,
            slug: updated.slug,
            seoTitle: updated.seoTitle,
            seoDescription: updated.seoDescription,
            logoUrl: updated.logoUrl,
            customDomain: updated.customDomain,
          },
          messages: updated.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          })),
        });
      } catch (error) {
        console.error("agent refine error", error);
        send({
          type: "error",
          error:
            error instanceof Error
              ? error.message
              : "Failed to refine website",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
