import { NextResponse } from "next/server";
import { z } from "zod";
import { runAgentLoop } from "@/lib/agents";
import { loadProjectMemory, persistAgentRun } from "@/lib/agents/memory-store";
import { buildMemory } from "@/lib/agents/memory";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { refineWebsite } from "@/lib/llm";
import { resolveModel } from "@/lib/llm/resolve-model";
import { resolveProvider } from "@/lib/llm/types";
import {
  deserializeProjectData,
  deserializeSiteData,
  serializeProjectData,
  serializeSiteData,
} from "@/lib/site-data";
import { snapshotProjectVersion } from "@/lib/versions";

const MAX_CHAT_CHARS = 12_000;
const CHAT_HISTORY_LIMIT = 60;

const schema = z.object({
  projectId: z.string().min(1),
  message: z.string().min(1).max(MAX_CHAT_CHARS),
  provider: z
    .enum(["nvidia", "openai", "gemini", "bytez", "openrouter", "openrouter-best", "omnroute", "demo"])
    .optional(),
  model: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  const session = await requireUserId();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const tooLong = parsed.error.issues.some(
        (i) => i.path.includes("message") && i.code === "too_big",
      );
      return NextResponse.json(
        {
          error: tooLong
            ? `Message is too long (max ${MAX_CHAT_CHARS} characters). Split it into a shorter request.`
            : "Invalid request",
        },
        { status: 400 },
      );
    }

    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, userId: session.userId },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: CHAT_HISTORY_LIMIT,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.html && !project.data) {
      return NextResponse.json(
        { error: "Generate a website first before refining." },
        { status: 400 },
      );
    }

    const provider = resolveProvider(parsed.data.provider);
    const model = resolveModel(provider, parsed.data.model, project.model);

    const existing = deserializeProjectData(project.data);
    let html: string;
    let serialized: string | undefined;
    let reply: string;
    let run: Awaited<ReturnType<typeof runAgentLoop>> | null = null;

    // Messages were fetched newest-first; restore chronological order.
    const history = [...project.messages].reverse();

    if (existing) {
      const memory = await loadProjectMemory(project.id, existing.spec).catch(
        () => buildMemory(existing.spec),
      );
      const recent = history
        .slice(-12)
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");
      const refineRequest = recent
        ? `${parsed.data.message}\n\nRecent conversation:\n${recent}`
        : parsed.data.message;
      run = await runAgentLoop({
        mode: "refine",
        request: refineRequest,
        provider,
        model,
        spec: existing.spec,
        memory,
      });
      html = run.html;
      serialized = serializeProjectData({
        spec: run.spec,
        website: run.website,
        brandKit: existing.brandKit,
      });
      reply = run.changed
        ? `Updated: ${run.summary}`
        : "I could not pin that change to a specific part of the site — try naming the section, e.g. \"make the hero button blue\".";
    } else {
      const result = await refineWebsite({
        currentHtml: project.html,
        currentData: deserializeSiteData(project.data),
        instruction: parsed.data.message,
        history: history.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        provider,
        model,
        originalPrompt: project.prompt,
      });
      html = result.html;
      serialized = serializeSiteData(result.data) ?? undefined;
      reply = result.reply;
    }

    await snapshotProjectVersion(project.id, "Before refine");

    if (run) {
      await persistAgentRun({
        projectId: project.id,
        kind: "refine",
        request: parsed.data.message,
        result: run,
      });
    }

    const updated = await prisma.project.update({
      where: { id: project.id },
      data: {
        html,
        data: serialized,
        provider,
        model,
        messages: {
          create: [
            { role: "user", content: parsed.data.message },
            { role: "assistant", content: reply },
          ],
        },
      },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json({
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
    console.error("chat error", error);
    const message =
      error instanceof Error ? error.message : "Failed to refine website";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
