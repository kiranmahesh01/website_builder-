import { NextResponse } from "next/server";
import { z } from "zod";
import { buildMagicBlueprint } from "@/lib/blueprint";

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
 * Magic AI Blueprint — Business Analysis, Customer Strategy, Website Structure,
 * Design Plan, conversion improvements, and multi-agent debate summary.
 * Deterministic DNA + design system + debate (no sequential heavy LLM calls).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const result = buildMagicBlueprint({
      brief: parsed.data.prompt,
      websiteType: parsed.data.websiteType,
      templateId: parsed.data.templateId,
      browseCategory: parsed.data.browseCategory,
    });

    const { planPreview, ...blueprint } = result;

    return NextResponse.json({
      blueprint,
      // Back-compat fields used by CreateWizard / plan consumers
      industry: planPreview.industry,
      websiteType: planPreview.websiteType,
      pages: planPreview.pages,
      design: planPreview.design,
      sections: blueprint.websiteStructure.map((s) => s.id),
      components: blueprint.websiteStructure.map((s) => s.label),
      summary: blueprint.summary,
      steps: planPreview.steps,
      designScorePreview: planPreview.designScorePreview,
      templates: planPreview.templates,
      browseTemplates: planPreview.browseTemplates,
      categories: planPreview.categories,
      brandKit: planPreview.brandKit,
      designSystem: blueprint.designPlan,
      debate: blueprint.debate,
      dna: blueprint.dna,
      expandedBrief: blueprint.expandedBrief,
      plan: {
        summary: planPreview.plan.summary,
        steps: planPreview.plan.steps,
        industry: planPreview.plan.industry,
        templateIds: planPreview.plan.templateIds,
        confidence: planPreview.plan.confidence,
        source: planPreview.plan.source,
      },
    });
  } catch (error) {
    console.error("agent blueprint error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to build Magic Blueprint",
      },
      { status: 500 },
    );
  }
}
