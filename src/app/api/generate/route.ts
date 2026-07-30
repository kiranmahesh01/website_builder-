import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { availableProviders, generateWebsite } from "@/lib/llm";
import { serializeSiteData } from "@/lib/site-data";
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
  uiKit: z.enum(["daisyui", "flowbite", "preline", "shadcn", "magic"]).optional(),
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

    const { html, data, provider, meta } = await generateWebsite({
      prompt: parsed.data.prompt,
      provider: parsed.data.provider,
      fast: parsed.data.fast,
      uiKit: parsed.data.uiKit,
    });

    const title = data?.brand || titleFromPrompt(parsed.data.prompt);
    const assistantMsg = meta?.adherence != null && meta.adherence < 55
      ? `Built your site from your brief (matched ${meta.adherence}% of your keywords — try refining in chat for more specificity). Preview on the right.`
      : meta?.model
        ? `Built from your brief with ${meta.model}${meta.retried ? " (refined for accuracy)" : ""}. Preview on the right — ask me to change anything.`
        : "Generated your website from your brief. Preview on the right — refine in chat anytime.";

    const projectData = {
      title,
      prompt: parsed.data.prompt,
      html,
      data: serializeSiteData(data) ?? undefined,
      provider,
      seoTitle: data?.seo?.title || data?.brand || title,
      seoDescription: data?.seo?.description || undefined,
      logoUrl: data?.logoUrl || undefined,
      messages: {
        create: [
          { role: "user", content: parsed.data.prompt },
          {
            role: "assistant",
            content: assistantMsg,
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
