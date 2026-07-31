import { generateWithNvidia } from "@/lib/llm/nvidia";
import { generateWithOpenRouter } from "@/lib/llm/openrouter";
import {
  extractJsonObject,
  type ChatMessage,
  type LlmProvider,
} from "@/lib/llm/types";
import { generateWithBytez } from "@/lib/llm/bytez";
import { generateWithGemini } from "@/lib/llm/gemini";
import { generateWithOpenAI } from "@/lib/llm/openai";
import {
  contentSystemPrompt,
  contentUserMessage,
  planUserMessage,
  PLAN_SYSTEM_PROMPT,
  structureUserMessage,
  STRUCTURE_SYSTEM_PROMPT,
} from "./prompts";
import { buildDemoPlan, buildDemoSpec } from "./demo-spec";
import {
  DEFAULT_SECTIONS,
  parsePageContent,
  parsePlan,
  parseStructure,
  type DesignTokens,
  type Plan,
  type SectionId,
  type SiteSpec,
} from "./schema";
import { specToWebsite } from "./to-website";
import type { Website } from "@/lib/schema";
import { enrichSpecWithImages } from "./images";
import {
  normalizeStructure,
  validateSectionContent,
  validateStructure,
} from "./validate";
import { parseBrief } from "@/lib/brief-parser";

/** Optional designer blueprint — skips structure LLM when sections are known. */
export type PipelineBlueprint = {
  theme?: Plan["theme"];
  sections?: SectionId[];
  design?: DesignTokens;
  /** Injected into content prompts (tone / avoid / headline patterns). */
  digest?: string;
};

/** One retry is enough when the primary model is healthy; avoids burning rate limits. */
const MAX_RETRIES = 1;

async function callJson(
  provider: Exclude<LlmProvider, "demo" | "openrouter-best">,
  messages: ChatMessage[],
  maxTokens: number,
  model?: string | null,
): Promise<unknown> {
  let raw: string;
  if (provider === "nvidia") {
    raw = await generateWithNvidia(messages, {
      maxTokens,
      json: true,
      model: model || undefined,
    });
  } else if (provider === "openai") {
    raw = await generateWithOpenAI(messages);
  } else if (provider === "gemini") {
    raw = await generateWithGemini(messages);
  } else if (provider === "openrouter") {
    raw = await generateWithOpenRouter(messages, {
      maxTokens,
      json: true,
      model: model || undefined,
    });
  } else {
    raw = await generateWithBytez(messages);
  }
  const json = extractJsonObject(raw);
  if (!json) throw new Error("Model returned invalid JSON");
  return json;
}

/** Never throws: a failed step should retry or fall back, not abort generation. */
async function tryCallJson(
  provider: Exclude<LlmProvider, "demo" | "openrouter-best">,
  messages: ChatMessage[],
  maxTokens: number,
  model: string | null | undefined,
  step: string,
): Promise<unknown | null> {
  try {
    return await callJson(provider, messages, maxTokens, model);
  } catch (error) {
    console.warn(
      `spec pipeline: ${step} attempt failed —`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

function businessContext(
  prompt: string,
  plan: Plan,
  blueprint?: PipelineBlueprint | null,
): string {
  const brief = parseBrief(prompt);
  return [
    `Brand: ${plan.brand}`,
    brief.location ? `Location: ${brief.location}` : null,
    brief.exactPhrases.length
      ? `Exact phrases to use: ${brief.exactPhrases.join("; ")}`
      : null,
    blueprint?.digest ? `Design blueprint:\n${blueprint.digest}` : null,
    `Original brief: ${prompt}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function planFromBlueprint(
  prompt: string,
  preferredTheme: string | null | undefined,
  blueprint?: PipelineBlueprint | null,
): Plan {
  const brief = parseBrief(prompt);
  const brand =
    brief.brandHint ||
    prompt
      .replace(/["']/g, " ")
      .split(/\s+/)
      .slice(0, 4)
      .join(" ")
      .trim()
      .slice(0, 48) ||
    "Studio";
  const theme = (blueprint?.theme ||
    preferredTheme ||
    "bold_startup") as Plan["theme"];
  return {
    theme,
    brand,
    pages: [
      {
        slug: "home",
        title: "Home",
        intent: `Homepage for ${brand}: ${prompt.slice(0, 180)}`,
      },
    ],
  };
}

async function callPlan(
  provider: Exclude<LlmProvider, "demo" | "openrouter-best">,
  prompt: string,
  preferredTheme?: string | null,
  model?: string | null,
): Promise<Plan> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const json = await tryCallJson(
      provider,
      [
        { role: "system", content: PLAN_SYSTEM_PROMPT },
        { role: "user", content: planUserMessage(prompt) },
      ],
      900,
      model,
      "plan",
    );
    if (!json) continue;
    const plan = parsePlan(json);
    if (plan) {
      if (preferredTheme) {
        return { ...plan, theme: preferredTheme as Plan["theme"] };
      }
      return plan;
    }
  }
  return buildDemoPlan(prompt, preferredTheme);
}

async function callStructure(
  provider: Exclude<LlmProvider, "demo" | "openrouter-best">,
  intent: string,
  context: string,
  model?: string | null,
): Promise<SectionId[]> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const json = await tryCallJson(
      provider,
      [
        { role: "system", content: STRUCTURE_SYSTEM_PROMPT },
        {
          role: "user",
          content: structureUserMessage(intent, context),
        },
      ],
      600,
      model,
      "structure",
    );
    if (!json) continue;
    const structure = parseStructure(json);
    if (structure) {
      const normalized = normalizeStructure(structure.sections);
      const err = validateStructure(normalized);
      if (!err) return normalized;
    }
  }
  return DEFAULT_SECTIONS;
}

async function callPageContent(
  provider: Exclude<LlmProvider, "demo" | "openrouter-best">,
  sectionIds: SectionId[],
  context: string,
  prompt: string,
  model?: string | null,
): Promise<{ id: SectionId; content: Record<string, unknown> }[]> {
  const demo = buildDemoSpec(prompt, undefined);
  const demoById = Object.fromEntries(
    demo.pages[0].sections.map((s) => [s.id, s.content]),
  ) as Record<string, Record<string, unknown>>;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const json = await tryCallJson(
      provider,
      [
        { role: "system", content: contentSystemPrompt(sectionIds) },
        { role: "user", content: contentUserMessage(sectionIds, context) },
      ],
      3600,
      model,
      "content",
    );
    if (!json) continue;
    const parsed = parsePageContent(json);
    if (!parsed) continue;

    const results: { id: SectionId; content: Record<string, unknown> }[] = [];
    let valid = true;

    for (const id of sectionIds) {
      const block = parsed.sections.find((s) => s.id === id);
      if (!block) {
        valid = false;
        break;
      }
      const err = validateSectionContent(id, block.content);
      if (err) {
        valid = false;
        break;
      }
      results.push({ id, content: block.content });
    }

    if (valid && results.length === sectionIds.length) return results;
  }

  return sectionIds.map((id) => ({
    id,
    content: demoById[id] || {},
  }));
}

export type SpecPipelineResult = {
  spec: SiteSpec;
  website: Website;
  meta: {
    pipeline: "spec";
    pages: number;
    sections: number;
  };
};

export async function generateSiteSpec(input: {
  prompt: string;
  provider: Exclude<LlmProvider, "demo" | "openrouter-best">;
  theme?: string | null;
  model?: string | null;
  blueprint?: PipelineBlueprint | null;
}): Promise<SiteSpec> {
  const preferredTheme = input.theme || input.blueprint?.theme || null;

  // When the designer already chose theme + sections, skip the plan LLM and
  // build a deterministic plan — saves a round-trip toward the ~50s budget.
  const plan =
    input.blueprint?.sections && input.blueprint.sections.length >= 5
      ? planFromBlueprint(input.prompt, preferredTheme, input.blueprint)
      : await callPlan(
          input.provider,
          input.prompt,
          preferredTheme,
          input.model,
        );

  const context = businessContext(input.prompt, plan, input.blueprint);

  const pages = await Promise.all(
    plan.pages.map(async (page) => {
      let sectionIds: SectionId[];
      if (input.blueprint?.sections && input.blueprint.sections.length >= 5) {
        const normalized = normalizeStructure(input.blueprint.sections);
        sectionIds =
          validateStructure(normalized) === null
            ? normalized
            : DEFAULT_SECTIONS;
      } else {
        sectionIds = await callStructure(
          input.provider,
          page.intent,
          context,
          input.model,
        );
      }

      const sections = await callPageContent(
        input.provider,
        sectionIds,
        context,
        input.prompt,
        input.model,
      );
      return {
        slug: page.slug,
        title: page.title,
        sections,
      };
    }),
  );

  return {
    theme: plan.theme,
    brand: plan.brand,
    seo: {
      title: `${plan.brand}`,
      description: input.prompt.slice(0, 155),
    },
    design:
      input.blueprint?.design && Object.keys(input.blueprint.design).length > 0
        ? input.blueprint.design
        : undefined,
    pages,
  };
}

export async function runSpecPipeline(input: {
  prompt: string;
  provider: LlmProvider;
  theme?: string | null;
  uiKit?: string | null;
  model?: string | null;
  blueprint?: PipelineBlueprint | null;
}): Promise<SpecPipelineResult> {
  if (input.provider === "demo") {
    const demo = buildDemoSpec(
      input.prompt,
      input.theme || input.blueprint?.theme,
    );
    const spec: SiteSpec = {
      ...demo,
      design:
        input.blueprint?.design && Object.keys(input.blueprint.design).length > 0
          ? { ...demo.design, ...input.blueprint.design }
          : demo.design,
    };
    const website = specToWebsite(spec, {
      theme: input.theme || spec.theme,
      uiKit: input.uiKit,
    });
    return {
      spec,
      website,
      meta: {
        pipeline: "spec",
        pages: spec.pages.length,
        sections: spec.pages.reduce((n, p) => n + p.sections.length, 0),
      },
    };
  }

  const llmProvider =
    input.provider === "openrouter-best" ? "openrouter" : input.provider;

  const spec = await generateSiteSpec({
    prompt: input.prompt,
    provider: llmProvider,
    theme: input.theme,
    model: input.model,
    blueprint: input.blueprint,
  });

  const enriched = await enrichSpecWithImages(spec);

  const website = specToWebsite(enriched, {
    theme: input.theme || enriched.theme,
    uiKit: input.uiKit,
  });

  return {
    spec: enriched,
    website,
    meta: {
      pipeline: "spec",
      pages: enriched.pages.length,
      sections: enriched.pages.reduce((n, p) => n + p.sections.length, 0),
    },
  };
}
