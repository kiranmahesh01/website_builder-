import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { availableProviders, generateWebsite } from "@/lib/llm";
import { serializeProjectData, serializeSiteData } from "@/lib/site-data";
import { assertCanCreateProject } from "@/lib/tier";
import { titleFromPrompt } from "@/lib/utils";
import { snapshotProjectVersion } from "@/lib/versions";

export const maxDuration = 120;

const schema = z.object({
  prompt: z.string().min(3).max(4000),
  provider: z
    .enum(["openai", "gemini", "bytez", "openrouter", "openrouter-best", "demo"])
    .optional(),
  projectId: z.string().optional(),
  fast: z.boolean().optional(),
  theme: z
    .enum(["bold_startup", "warm_editorial", "minimal_studio"])
    .optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providers = availableProviders();
  if (providers.length === 0) {
    return NextResponse.json(
      { error: "Generation is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (!parsed.data.projectId) {
      await assertCanCreateProject(session.user.id);
    }

    const { html, data, spec, provider, meta } = await generateWebsite({
      prompt: parsed.data.prompt,
      provider: parsed.data.provider,
      fast: parsed.data.fast,
      theme: parsed.data.theme,
    });

    const title = data?.brand || titleFromPrompt(parsed.data.prompt);
    const assistantMsg =
      meta?.adherence != null && meta.adherence < 55
        ? `Built your site from your brief (matched ${meta.adherence}% of your keywords — try refining in chat). Preview on the right.`
        : "Your site is ready — preview on the right. Ask me to change copy, colors, or sections in chat.";

    const serializedData =
      spec && data
        ? serializeProjectData({ spec, website: data })
        : serializeSiteData(data) ?? undefined;

    const projectData = {
      title,
      prompt: parsed.data.prompt,
      html,
      data: serializedData,
      provider,
      seoTitle: data?.seo?.title || data?.brand || title,
      seoDescription: data?.seo?.description || undefined,
      logoUrl: data?.logoUrl || undefined,
      messages: {
        create: [
          { role: "user", content: parsed.data.prompt },
          { role: "assistant", content: assistantMsg },
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
      await snapshotProjectVersion(existing.id, "Before regenerate");
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
        seoTitle: project.seoTitle,
        seoDescription: project.seoDescription,
        logoUrl: project.logoUrl,
        customDomain: project.customDomain,
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
