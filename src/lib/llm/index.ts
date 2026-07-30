import { generateWithBytez } from "./bytez";
import { generateWebsiteData, refineWithDemo } from "./demo";
import { generateWithGemini } from "./gemini";
import { generateWithOpenAI } from "./openai";
import { generateWithOpenRouter } from "./openrouter";
import { parseWebsite, type Website } from "@/lib/schema";
import { renderWebsiteToHtml } from "@/lib/render-site";
import {
  SITE_JSON_SYSTEM_PROMPT,
  SITE_REFINE_SYSTEM_PROMPT,
} from "@/lib/site-prompt";
import {
  availableProviders,
  extractHtml,
  extractJsonObject,
  REFINE_SYSTEM_PROMPT,
  resolveProvider,
  WEBSITE_SYSTEM_PROMPT,
  type ChatMessage,
  type LlmProvider,
} from "./types";

async function generateWithProvider(
  provider: Exclude<LlmProvider, "demo">,
  messages: ChatMessage[],
  model?: string | null,
): Promise<string> {
  if (provider === "openai") {
    return generateWithOpenAI(messages, { model: model || undefined });
  }
  if (provider === "gemini") {
    return generateWithGemini(messages, { model: model || undefined });
  }
  if (provider === "openrouter") {
    return generateWithOpenRouter(messages, { model: model || undefined });
  }
  return generateWithBytez(messages, { model: model || undefined });
}

export type GenerateResult = {
  html: string;
  data: Website | null;
  provider: LlmProvider;
  raw: string;
  mode: "schema" | "html";
};

export async function generateWebsite(input: {
  prompt: string;
  provider?: string | null;
  model?: string | null;
}): Promise<GenerateResult> {
  const provider = resolveProvider(input.provider);

  if (provider === "demo") {
    const data = generateWebsiteData(input.prompt);
    return {
      html: renderWebsiteToHtml(data),
      data,
      provider,
      raw: JSON.stringify(data),
      mode: "schema",
    };
  }

  const messages: ChatMessage[] = [
    { role: "system", content: SITE_JSON_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Build a complete multi-page website JSON for this brief:\n\n${input.prompt}`,
    },
  ];

  const raw = await generateWithProvider(provider, messages, input.model);
  const json = extractJsonObject(raw);
  const data = json ? parseWebsite(json) : null;

  if (data) {
    return {
      html: renderWebsiteToHtml(data),
      data,
      provider,
      raw,
      mode: "schema",
    };
  }

  // Fallback: ask again as raw HTML if the model ignored JSON instructions
  const htmlMessages: ChatMessage[] = [
    { role: "system", content: WEBSITE_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Build a complete website for this brief:\n\n${input.prompt}`,
    },
  ];
  const htmlRaw = await generateWithProvider(provider, htmlMessages, input.model);
  return {
    html: extractHtml(htmlRaw),
    data: null,
    provider,
    raw: htmlRaw,
    mode: "html",
  };
}

/** @deprecated Use generateWebsite */
export async function generateWebsiteHtml(input: {
  prompt: string;
  provider?: string | null;
  model?: string | null;
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
      html: renderWebsiteToHtml(data),
      data,
      provider,
      reply: `Updated the structured site in demo mode based on: "${input.instruction}"`,
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
    const messages: ChatMessage[] = [
      { role: "system", content: SITE_REFINE_SYSTEM_PROMPT },
      ...historyMessages,
      {
        role: "user",
        content: `Current website JSON:\n\n${JSON.stringify(input.currentData)}\n\nChange request:\n${input.instruction}`,
      },
    ];
    const raw = await generateWithProvider(provider, messages, input.model);
    const json = extractJsonObject(raw);
    const data = json ? parseWebsite(json) : null;
    if (data) {
      return {
        html: renderWebsiteToHtml(data),
        data,
        provider,
        reply: `Updated the structured site based on: "${input.instruction}"`,
        mode: "schema",
      };
    }
  }

  // HTML fallback (legacy projects or failed JSON refine)
  const messages: ChatMessage[] = [
    { role: "system", content: REFINE_SYSTEM_PROMPT },
    ...historyMessages,
    {
      role: "user",
      content: `Current website HTML:\n\n${input.currentHtml}\n\nChange request:\n${input.instruction}`,
    },
  ];
  const raw = await generateWithProvider(provider, messages, input.model);
  return {
    html: extractHtml(raw),
    data: null,
    provider,
    reply: `Updated the site based on: "${input.instruction}"`,
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

export { availableProviders, resolveProvider };
export type { LlmProvider };
