import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { availableProviders, generateWebsite } from "@/lib/llm";
import { serializeSiteData } from "@/lib/site-data";
import { titleFromPrompt } from "@/lib/utils";

const schema = z.object({
  prompt: z.string().min(3).max(4000),
  provider: z
    .enum(["openai", "gemini", "bytez", "openrouter", "demo"])
    .optional(),
  projectId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providers = availableProviders();
  if (providers.length === 0) {
    return NextResponse.json(
      {
        error:
          "No LLM providers available. Use Demo (no API key), or add OPENAI_API_KEY / GOOGLE_AI_API_KEY / BYTEZ_API_KEY / OPENROUTER_API_KEY to .env and restart.",
      },
      { status: 503 },
    );
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { html, data, provider } = await generateWebsite({
      prompt: parsed.data.prompt,
      provider: parsed.data.provider,
    });

    const title = titleFromPrompt(parsed.data.prompt);
    const projectData = {
      title,
      prompt: parsed.data.prompt,
      html,
      data: serializeSiteData(data) ?? undefined,
      provider,
      messages: {
        create: [
          { role: "user", content: parsed.data.prompt },
          {
            role: "assistant",
            content:
              "Generated your website from structured sections. Preview it on the right — ask me to refine anything.",
          },
        ],
      },
    };

    let project;
    if (parsed.data.projectId) {
      const existing = await prisma.project.findFirst({
        where: { id: parsed.data.projectId, userId: session.user.id },
      });
      if (!existing) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      project = await prisma.project.update({
        where: { id: existing.id },
        data: projectData,
      });
    } else {
      project = await prisma.project.create({
        data: {
          ...projectData,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        html: project.html,
        data: project.data,
        provider: project.provider,
        published: project.published,
        slug: project.slug,
      },
      providers,
    });
  } catch (error) {
    console.error("generate error", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate website";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
