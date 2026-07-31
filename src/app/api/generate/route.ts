import { NextResponse } from "next/server";
import { z } from "zod";
import { runAgentLoop, type AgentRunResult } from "@/lib/agents";
import { persistAgentRun } from "@/lib/agents/memory-store";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { availableProviders, generateWebsite } from "@/lib/llm";
import { resolveModel } from "@/lib/llm/resolve-model";
import { resolveProvider } from "@/lib/llm/types";
import { parseBrief, scoreBriefAdherence } from "@/lib/brief-parser";
import { serializeProjectData, serializeSiteData } from "@/lib/site-data";
import { assertCanCreateProject } from "@/lib/tier";
import { titleFromPrompt } from "@/lib/utils";
import { snapshotProjectVersion } from "@/lib/versions";
import { expandPromptToExpertBrief } from "@/lib/prompt";
import {
  buildMagicBlueprint,
  magicBlueprintToWebsiteBlueprint,
} from "@/lib/blueprint";
import { applyDesignSystemToSpec } from "@/lib/design-system";
import {
  parseUserPreferences,
  preferencePromptBlock,
} from "@/lib/preferences";
import { learnFromMagicNotes } from "@/lib/magic-score";
import { renderSpecToHtml } from "@/lib/render-site";
import { specToWebsite } from "@/lib/spec/to-website";
import { ensureSeo } from "@/lib/agents/seo";

export const maxDuration = 120;

const MAX_PROMPT_CHARS = 12_000;

const schema = z.object({
  prompt: z.string().min(3).max(MAX_PROMPT_CHARS),
  provider: z
    .enum(["nvidia", "openai", "gemini", "bytez", "openrouter", "openrouter-best", "demo"])
    .optional(),
  model: z.string().max(120).optional(),
  projectId: z.string().optional(),
  fast: z.boolean().optional(),
  theme: z
    .enum(["bold_startup", "warm_editorial", "minimal_studio"])
    .optional(),
  /** User-selected template from the create wizard. */
  templateId: z.string().max(120).optional(),
  brandKit: z
    .object({
      businessName: z.string(),
      tagline: z.string(),
      description: z.string(),
      logoIdea: z.string(),
      colors: z.object({
        primary: z.string(),
        accent: z.string(),
        surface: z.string(),
        text: z.string(),
      }),
      fonts: z.object({
        display: z.string(),
        body: z.string(),
      }),
      audience: z.string(),
      socialPosts: z.array(z.string()),
      source: z.literal("deterministic"),
    })
    .optional(),
});

export async function POST(req: Request) {
  const session = await requireUserId();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
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
      const tooLong = parsed.error.issues.some(
        (i) => i.path.includes("prompt") && i.code === "too_big",
      );
      return NextResponse.json(
        {
          error: tooLong
            ? `Prompt is too long (max ${MAX_PROMPT_CHARS} characters). Shorten it and try again.`
            : "Invalid request",
        },
        { status: 400 },
      );
    }

    if (!parsed.data.projectId) {
      await assertCanCreateProject(session.userId);
    }

    const provider = resolveProvider(parsed.data.provider);
    const model = resolveModel(provider, parsed.data.model);

    // Prompt Optimization Engine — expand short ideas into expert briefs.
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { preferences: true },
    });
    const prefs = parseUserPreferences(user?.preferences);
    const prefBlock = preferencePromptBlock(prefs);
    const expanded = expandPromptToExpertBrief({ idea: parsed.data.prompt });
    const requestPrompt = [expanded.expandedBrief, prefBlock]
      .filter(Boolean)
      .join("\n\n");

    const magicBlueprint = buildMagicBlueprint({
      brief: parsed.data.prompt,
      templateId: parsed.data.templateId,
    });
    const seedBlueprint = magicBlueprintToWebsiteBlueprint(magicBlueprint);

    // Generate → review → fix. Seed DNA/Magic Blueprint so designer LLM is
    // skipped; keep one content LLM + at most one repair round (~30–50s).
    let run: AgentRunResult | null = null;
    try {
      run = await runAgentLoop({
        mode: "generate",
        request: requestPrompt,
        provider,
        model,
        theme: parsed.data.theme,
        templateId: parsed.data.templateId || magicBlueprint.templateHints[0],
        seedBlueprint,
        maxFixAttempts: 1,
      });
      // Design System Generator — apply tokens and re-render so HTML matches.
      if (run?.spec) {
        const nextSpec = ensureSeo(
          applyDesignSystemToSpec(run.spec, magicBlueprint.designPlan),
        );
        const website = specToWebsite(nextSpec);
        const html = await renderSpecToHtml(nextSpec);
        run = { ...run, spec: nextSpec, website, html };
        if (run.review.scores) {
          learnFromMagicNotes(
            run.review.issues.map((i) => i.message),
            run.review.scores,
            magicBlueprint.dna.industry,
          );
        }
      }
    } catch (agentError) {
      console.error("agent generate failed, using legacy generator", agentError);
    }

    const legacy = run
      ? null
      : await generateWebsite({
          prompt: requestPrompt,
          provider,
          model,
          fast: parsed.data.fast,
          theme: parsed.data.theme,
        });

    const html = run ? run.html : legacy!.html;
    const data = run ? run.website : legacy!.data;
    const spec = run ? run.spec : legacy!.spec;
    const adherence = run
      ? scoreBriefAdherence(run.website, parseBrief(parsed.data.prompt))
      : (legacy!.meta?.adherence ?? null);

    const title = data?.brand || titleFromPrompt(parsed.data.prompt);
    const assistantMsg =
      adherence != null && adherence < 55
        ? `Built your site from your brief (matched ${adherence}% of your keywords — try refining in chat). Preview on the right.`
        : "Your site is ready — preview on the right. Ask me to change copy, colors, or sections in chat.";

    const serializedData =
      spec && data
        ? serializeProjectData({
            spec,
            website: data,
            brandKit: parsed.data.brandKit,
          })
        : serializeSiteData(data) ?? undefined;

    const projectData = {
      title,
      prompt: parsed.data.prompt,
      html,
      data: serializedData,
      provider,
      model,
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
        where: { id: parsed.data.projectId, userId: session.userId },
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
          userId: session.userId,
        },
      });
    }

    if (run) {
      await persistAgentRun({
        projectId: project.id,
        kind: "generate",
        request: parsed.data.prompt,
        result: run,
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
      review: run
        ? {
            score: run.review.score,
            passed: run.review.passed,
            scores: run.review.scores,
            issues: run.review.issues.map((issue) => ({
              code: issue.code,
              severity: issue.severity,
              message: issue.message,
              hint: issue.hint,
              path: issue.path,
              sectionKey: issue.sectionKey,
            })),
          }
        : null,
      events: run?.events ?? [],
      templateIds: run?.blueprint?.templateIds ?? [],
      brandKit: parsed.data.brandKit ?? null,
      seo: data?.seo
        ? {
            title: data.seo.title,
            description: data.seo.description,
            keywords: data.seo.keywords,
          }
        : run?.spec.seo
          ? {
              title: run.spec.seo.title,
              description: run.spec.seo.description,
              keywords: run.spec.seo.keywords,
            }
          : null,
    });
  } catch (error) {
    console.error("generate error", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate website";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
