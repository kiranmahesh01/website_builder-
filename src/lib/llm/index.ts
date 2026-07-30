import { generateWithBytez } from "./bytez";
import { generateWebsiteData, refineWithDemo } from "./demo";
import { generateWithGemini } from "./gemini";
import { generateWithOpenAI } from "./openai";
import { generateWithOpenRouter } from "./openrouter";
import { generateOpenRouterBestOf } from "./openrouter-best";
import {
  DEFAULT_OPENROUTER_MODEL,
  PAID_FALLBACK_MODEL,
} from "./openrouter-models";
import type { Website } from "@/lib/schema";
import {
  buildBriefUserMessage,
  parseBrief,
  scoreBriefAdherence,
} from "@/lib/brief-parser";
import { normalizeUiKit } from "@/lib/ui-kits";
import {
  getThemeTokens,
  normalizeSiteTheme,
  pickThemeFromBrief,
  themeToUiKit,
  type SiteThemeName,
} from "@/lib/themes";
import { parseWebsiteLenient } from "@/lib/site-coerce";
import { renderSpecToHtml, renderWebsiteToHtml } from "@/lib/render-site";
import { runSpecPipeline } from "@/lib/spec/pipeline";
import type { SiteSpec } from "@/lib/spec/schema";
import { scoreWebsite } from "./score-site";
import {
  fastModePromptAppendix,
  SITE_JSON_SYSTEM_PROMPT,
  SITE_REFINE_SYSTEM_PROMPT,
  SITE_RETRY_SYSTEM_APPENDIX,
} from "@/lib/site-prompt";
import {
  availableProviders,
  extractHtml,
  extractJsonObject,
  getDefaultProvider,
  REFINE_SYSTEM_PROMPT,
  resolveProvider,
  WEBSITE_SYSTEM_PROMPT,
  type ChatMessage,
  type LlmProvider,
} from "./types";

const ADHERENCE_RETRY_THRESHOLD = 52;

function applyThemeAndKit(
  data: Website,
  prompt: string,
  options?: { uiKit?: string | null; theme?: string | null },
): Website {
  const themeName: SiteThemeName = options?.theme
    ? normalizeSiteTheme(options.theme)
    : pickThemeFromBrief(prompt);
  const kit = options?.uiKit
    ? normalizeUiKit(options.uiKit)
    : themeToUiKit(themeName);
  const lockedTheme = getThemeTokens(themeName);
  return {
    ...data,
    theme: lockedTheme,
    uiKit: kit,
  };
}

async function generateWithProvider(
  provider: Exclude<LlmProvider, "demo" | "openrouter-best">,
  messages: ChatMessage[],
  model?: string | null,
  options?: { maxTokens?: number },
): Promise<string> {
  if (provider === "openai") {
    return generateWithOpenAI(messages, { model: model || undefined });
  }
  if (provider === "gemini") {
    return generateWithGemini(messages, { model: model || undefined });
  }
  if (provider === "openrouter") {
    return generateWithOpenRouter(messages, {
      model: model || undefined,
      maxTokens: options?.maxTokens,
    });
  }
  return generateWithBytez(messages, { model: model || undefined });
}

function buildGenerationMessages(
  prompt: string,
  options?: { fast?: boolean; retry?: boolean },
): ChatMessage[] {
  const brief = parseBrief(prompt);
  const system = options?.retry
    ? `${SITE_JSON_SYSTEM_PROMPT}\n${SITE_RETRY_SYSTEM_APPENDIX}`
    : SITE_JSON_SYSTEM_PROMPT + (options?.fast ? fastModePromptAppendix() : "");

  return [
    { role: "system", content: system },
    {
      role: "user",
      content: buildBriefUserMessage(brief, { fast: options?.fast }),
    },
  ];
}

async function generateStructuredOnce(
  provider: Exclude<LlmProvider, "demo" | "openrouter-best">,
  prompt: string,
  model: string | null | undefined,
  options?: { fast?: boolean; retry?: boolean },
): Promise<{ data: Website; raw: string; adherence: number } | null> {
  const messages = buildGenerationMessages(prompt, options);
  const maxTokens = options?.fast ? 3800 : 6500;
  const raw = await generateWithProvider(provider, messages, model, {
    maxTokens,
  });
  const json = extractJsonObject(raw);
  const data = json ? parseWebsiteLenient(json) : null;
  if (!data) return null;
  const adherence = scoreBriefAdherence(data, parseBrief(prompt));
  return { data, raw, adherence };
}

async function generateWithAdherenceRetry(
  provider: Exclude<LlmProvider, "demo" | "openrouter-best">,
  prompt: string,
  model?: string | null,
  options?: { fast?: boolean },
): Promise<{
  data: Website;
  raw: string;
  adherence: number;
  retried: boolean;
}> {
  const first = await generateStructuredOnce(provider, prompt, model, options);
  if (!first) {
    throw new Error("Model returned invalid site JSON. Try again or shorten your brief.");
  }

  if (first.adherence >= ADHERENCE_RETRY_THRESHOLD) {
    return { ...first, retried: false };
  }

  console.warn(
    `Brief adherence ${first.adherence} below ${ADHERENCE_RETRY_THRESHOLD}, retrying with stricter prompt`,
  );

  const second = await generateStructuredOnce(provider, prompt, model, {
    ...options,
    retry: true,
  });

  if (!second) return { ...first, retried: true };
  if (second.adherence >= first.adherence) {
    return { ...second, retried: true };
  }
  return { ...first, retried: true };
}

export type GenerateResult = {
  html: string;
  data: Website | null;
  spec?: SiteSpec | null;
  provider: LlmProvider;
  raw: string;
  mode: "schema" | "html";
  meta?: {
    model?: string;
    score?: number;
    adherence?: number;
    attempts?: number;
    validCount?: number;
    modelsTried?: string[];
    retried?: boolean;
    pipeline?: string;
    sections?: number;
    pages?: number;
  };
};

async function generateWebsiteLegacy(
  input: {
    prompt: string;
    provider?: string | null;
    model?: string | null;
    fast?: boolean;
    uiKit?: string | null;
    theme?: string | null;
  },
  provider: LlmProvider,
): Promise<GenerateResult> {
  if (provider === "demo") {
    const data = applyThemeAndKit(generateWebsiteData(input.prompt), input.prompt, {
      uiKit: input.uiKit,
      theme: input.theme,
    });
    return {
      html: await renderWebsiteToHtml(data),
      data,
      provider,
      raw: JSON.stringify(data),
      mode: "schema",
      meta: { pipeline: "legacy" },
    };
  }

  if (provider === "openrouter-best") {
    const messages = buildGenerationMessages(input.prompt, {
      fast: input.fast,
    });
    try {
      const best = await generateOpenRouterBestOf(messages, input.prompt);
      let adherence = scoreBriefAdherence(best.site, parseBrief(input.prompt));

      if (adherence < ADHERENCE_RETRY_THRESHOLD) {
        const retry = await generateStructuredOnce(
          "openrouter",
          input.prompt,
          input.model,
          { fast: input.fast, retry: true },
        );
        if (retry && retry.adherence > adherence) {
          const data = applyThemeAndKit(retry.data, input.prompt, {
            uiKit: input.uiKit,
            theme: input.theme,
          });
          return {
            html: await renderWebsiteToHtml(data),
            data,
            provider: "openrouter",
            raw: retry.raw,
            mode: "schema",
            meta: {
              model: process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL,
              score: scoreWebsite(retry.data),
              adherence: retry.adherence,
              attempts: best.attempts + 1,
              retried: true,
              pipeline: "legacy",
            },
          };
        }
      }

      return {
        html: await renderWebsiteToHtml(
          applyThemeAndKit(best.site, input.prompt, {
            uiKit: input.uiKit,
            theme: input.theme,
          }),
        ),
        data: applyThemeAndKit(best.site, input.prompt, {
          uiKit: input.uiKit,
          theme: input.theme,
        }),
        provider,
        raw: best.raw,
        mode: "schema",
        meta: {
          model: best.model,
          score: best.score,
          adherence,
          attempts: best.attempts,
          validCount: best.validCount,
          modelsTried: best.modelsTried,
          pipeline: "legacy",
        },
      };
    } catch (raceError) {
      console.error("openrouter-best failed, falling back to single model", raceError);
      const single = await generateWithAdherenceRetry(
        "openrouter",
        input.prompt,
        input.model,
        { fast: input.fast },
      );
      return {
        html: await renderWebsiteToHtml(
          applyThemeAndKit(single.data, input.prompt, {
            uiKit: input.uiKit,
            theme: input.theme,
          }),
        ),
        data: applyThemeAndKit(single.data, input.prompt, {
          uiKit: input.uiKit,
          theme: input.theme,
        }),
        provider: "openrouter",
        raw: single.raw,
        mode: "schema",
        meta: {
          model: process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL,
          score: scoreWebsite(single.data),
          adherence: single.adherence,
          attempts: 2,
          retried: single.retried,
          pipeline: "legacy",
        },
      };
    }
  }

  const result = await generateWithAdherenceRetry(
    provider,
    input.prompt,
    input.model,
    { fast: input.fast },
  );

  return {
    html: await renderWebsiteToHtml(
      applyThemeAndKit(result.data, input.prompt, {
        uiKit: input.uiKit,
        theme: input.theme,
      }),
    ),
    data: applyThemeAndKit(result.data, input.prompt, {
      uiKit: input.uiKit,
      theme: input.theme,
    }),
    provider,
    raw: result.raw,
    mode: "schema",
    meta: {
      score: scoreWebsite(result.data),
      adherence: result.adherence,
      retried: result.retried,
      attempts: result.retried ? 2 : 1,
      pipeline: "legacy",
    },
  };
}

export async function generateWebsite(input: {
  prompt: string;
  provider?: string | null;
  model?: string | null;
  fast?: boolean;
  uiKit?: string | null;
  theme?: string | null;
}): Promise<GenerateResult> {
  const provider = resolveProvider(input.provider);

  try {
    const result = await runSpecPipeline({
      prompt: input.prompt,
      provider,
      theme: input.theme,
      uiKit: input.uiKit,
    });
    const adherence = scoreBriefAdherence(
      result.website,
      parseBrief(input.prompt),
    );
    const html = await renderSpecToHtml(result.spec);
    return {
      html,
      data: result.website,
      spec: result.spec,
      provider,
      raw: JSON.stringify(result.spec),
      mode: "schema",
      meta: {
        score: scoreWebsite(result.website),
        adherence,
        pipeline: "spec",
        sections: result.meta.sections,
        pages: result.meta.pages,
      },
    };
  } catch (specError) {
    console.error("Spec pipeline failed, using legacy generator", specError);
    return generateWebsiteLegacy(input, provider);
  }
}

/** @deprecated Use generateWebsite */
export async function generateWebsiteHtml(input: {
  prompt: string;
  provider?: string | null;
  model?: string | null;
  fast?: boolean;
}): Promise<{ html: string; provider: LlmProvider; raw: string }> {
  const result = await generateWebsite(input);
  return { html: result.html, provider: result.provider, raw: result.raw };
}

export async function refineWebsite(input: {
  currentHtml: string;
  currentData?: Website | null;
  instruction: string;
  history?: { role: string; content: string }[];
  provider?: string | null;
  model?: string | null;
  originalPrompt?: string | null;
}): Promise<{
  html: string;
  data: Website | null;
  provider: LlmProvider;
  reply: string;
  mode: "schema" | "html";
  meta?: GenerateResult["meta"];
}> {
  const provider = resolveProvider(input.provider);

  if (provider === "demo") {
    const data = refineWithDemo({
      currentData: input.currentData || null,
      currentHtml: input.currentHtml,
      instruction: input.instruction,
      originalPrompt: input.originalPrompt || undefined,
    });
    return {
      html: await renderWebsiteToHtml(data),
      data,
      provider,
      reply: `Applied your change in demo mode: "${input.instruction}"`,
      mode: "schema",
    };
  }

  const historyMessages: ChatMessage[] = (input.history || [])
    .slice(-6)
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

  if (input.currentData) {
    const briefNote = input.originalPrompt
      ? `\n\nOriginal client brief (keep honoring this):\n${input.originalPrompt}`
      : "";
    const messages: ChatMessage[] = [
      { role: "system", content: SITE_REFINE_SYSTEM_PROMPT },
      ...historyMessages,
      {
        role: "user",
        content: `Current website JSON:\n\n${JSON.stringify(input.currentData)}${briefNote}\n\nChange request (apply exactly):\n${input.instruction}`,
      },
    ];

    if (provider === "openrouter-best") {
      try {
        const best = await generateOpenRouterBestOf(
          messages,
          input.originalPrompt || input.instruction,
        );
        return {
          html: await renderWebsiteToHtml(best.site),
          data: best.site,
          provider,
          reply: `Updated based on: "${input.instruction}"`,
          mode: "schema",
          meta: {
            model: best.model,
            score: best.score,
            attempts: best.attempts,
          },
        };
      } catch {
        // fall through to single openrouter refine
      }
    }

    const singleProvider =
      provider === "openrouter-best" ? "openrouter" : provider;
    const raw = await generateWithProvider(
      singleProvider,
      messages,
      input.model,
      { maxTokens: 6500 },
    );
    const json = extractJsonObject(raw);
    const data = json ? parseWebsiteLenient(json) : null;
    if (data) {
      return {
        html: await renderWebsiteToHtml(data),
        data,
        provider,
        reply: `Updated based on: "${input.instruction}"`,
        mode: "schema",
      };
    }
  }

  const messages: ChatMessage[] = [
    { role: "system", content: REFINE_SYSTEM_PROMPT },
    ...historyMessages,
    {
      role: "user",
      content: `Current website HTML:\n\n${input.currentHtml}\n\nChange request:\n${input.instruction}`,
    },
  ];
  const fallbackProvider =
    provider === "openrouter-best" ? "openrouter" : provider;
  const raw = await generateWithProvider(
    fallbackProvider,
    messages,
    input.model,
  );
  return {
    html: extractHtml(raw),
    data: null,
    provider,
    reply: `Updated based on: "${input.instruction}"`,
    mode: "html",
  };
}

/** @deprecated Use refineWebsite */
export async function refineWebsiteHtml(input: {
  currentHtml: string;
  instruction: string;
  history?: { role: string; content: string }[];
  provider?: string | null;
  model?: string | null;
  originalPrompt?: string | null;
}): Promise<{ html: string; provider: LlmProvider; reply: string }> {
  const result = await refineWebsite(input);
  return {
    html: result.html,
    provider: result.provider,
    reply: result.reply,
  };
}

export { availableProviders, resolveProvider, getDefaultProvider };
export type { LlmProvider };
