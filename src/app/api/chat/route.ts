import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { refineWebsite } from "@/lib/llm";
import { deserializeSiteData, serializeSiteData } from "@/lib/site-data";

const schema = z.object({
  projectId: z.string().min(1),
  message: z.string().min(1).max(4000),
  provider: z
    .enum(["openai", "gemini", "bytez", "openrouter", "demo"])
    .optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, userId: session.user.id },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 20 },
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

    const { html, data, provider, reply } = await refineWebsite({
      currentHtml: project.html,
      currentData: deserializeSiteData(project.data),
      instruction: parsed.data.message,
      history: project.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      provider: parsed.data.provider || project.provider,
      originalPrompt: project.prompt,
    });

    const updated = await prisma.project.update({
      where: { id: project.id },
      data: {
        html,
        data: serializeSiteData(data) ?? undefined,
        provider,
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
