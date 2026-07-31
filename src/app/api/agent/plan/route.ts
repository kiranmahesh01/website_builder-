import { NextResponse } from "next/server";
import { z } from "zod";
import { buildWebsitePlan } from "@/lib/create";

export const runtime = "nodejs";

const schema = z.object({
  prompt: z.string().min(3).max(12_000),
  websiteType: z
    .enum(["business", "portfolio", "store", "blog", "landing"])
    .optional(),
  templateId: z.string().max(120).optional(),
  browseCategory: z
    .enum(["business", "store", "professional", "technology"])
    .optional(),
});

/**
 * Lightweight AI Website Plan — deterministic template engine + planner/designer
 * path. No full site generation and no heavy content LLM. Session not required
 * so the create wizard can preview before login; generate still requires auth.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const preview = buildWebsitePlan({
      brief: parsed.data.prompt,
      websiteType: parsed.data.websiteType,
      templateId: parsed.data.templateId,
      templateLimit: 4,
      browseCategory: parsed.data.browseCategory,
    });

    return NextResponse.json({
      industry: preview.industry,
      websiteType: preview.websiteType,
      pages: preview.pages,
      design: preview.design,
      sections: preview.sections,
      components: preview.components,
      summary: preview.summary,
      steps: preview.steps,
      designScorePreview: preview.designScorePreview,
      templates: preview.templates,
      browseTemplates: preview.browseTemplates,
      categories: preview.categories,
      brandKit: preview.brandKit,
      plan: {
        summary: preview.plan.summary,
        steps: preview.plan.steps,
        industry: preview.plan.industry,
        templateIds: preview.plan.templateIds,
        confidence: preview.plan.confidence,
        source: preview.plan.source,
      },
      blueprint: {
        industry: preview.blueprint.industry,
        style: preview.blueprint.style,
        theme: preview.blueprint.theme,
        design: preview.blueprint.design,
        sections: preview.blueprint.sections,
        toneRules: preview.blueprint.toneRules,
        dontRules: preview.blueprint.dontRules,
        templateIds: preview.blueprint.templateIds,
        confidence: preview.blueprint.confidence,
        source: preview.blueprint.source,
      },
    });
  } catch (error) {
    console.error("agent plan error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to build website plan",
      },
      { status: 500 },
    );
  }
}
