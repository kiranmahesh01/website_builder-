/**
 * Screenshot → structured site brief via OpenRouter vision (optional).
 * Graceful degrade when no vision key is configured.
 */

import OpenAI from "openai";
import { z } from "zod";
import {
  FREE_OPENROUTER_MODELS,
  openRouterVisionModel,
} from "@/lib/llm/openrouter-models";
import type { CreateWizardAnswers } from "./brief";
import { EMPTY_CREATE_ANSWERS } from "./brief";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

const VisionBriefSchema = z.object({
  websiteType: z
    .enum(["business", "portfolio", "store", "blog", "landing"])
    .catch("business"),
  industry: z.string().min(1).max(64).catch("General"),
  style: z
    .enum(["minimal", "luxury", "modern", "bold", "corporate"])
    .catch("modern"),
  businessName: z.string().max(80).optional().catch(""),
  goal: z.string().max(200).optional().catch(""),
  brandFeeling: z.string().max(200).optional().catch(""),
  colors: z.string().max(160).optional().catch(""),
  sections: z.array(z.string().max(80)).max(10).optional().catch([]),
  summary: z.string().max(400).optional().catch(""),
});

export type ScreenshotAnalyzeResult = {
  available: boolean;
  message: string;
  answers: Partial<CreateWizardAnswers>;
  summary: string;
  suggestedSections: string[];
  model?: string;
};

export function visionAvailable(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

function parseJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1]?.trim() || text.trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function analyzeScreenshotForWebsite(
  imageDataUrl: string,
  hint?: string,
): Promise<ScreenshotAnalyzeResult> {
  if (!process.env.OPENROUTER_API_KEY) {
    return {
      available: false,
      message:
        "Screenshot analysis needs OPENROUTER_API_KEY (vision model). You can still describe the site manually — generation does not require vision.",
      answers: {},
      summary: "",
      suggestedSections: [],
    };
  }

  if (!imageDataUrl.startsWith("data:image/") && !/^https?:\/\//.test(imageDataUrl)) {
    return {
      available: false,
      message: "Upload a PNG/JPG screenshot (data URL or public image URL).",
      answers: {},
      summary: "",
      suggestedSections: [],
    };
  }

  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: OPENROUTER_BASE,
    defaultHeaders: {
      "HTTP-Referer":
        process.env.AUTH_URL || "https://websitebuilder-main.vercel.app",
      "X-Title": "Magic AI Screenshot",
    },
  });

  const visionModels = [
    openRouterVisionModel(),
    ...FREE_OPENROUTER_MODELS.filter((m) => m.includes("gemma")),
  ];

  const prompt = `You analyze a website screenshot to rebuild a similar site in Magic AI.
${hint ? `User hint: ${hint}` : ""}

Return STRICT JSON only:
{
  "websiteType": "business|portfolio|store|blog|landing",
  "industry": "short niche",
  "style": "minimal|luxury|modern|bold|corporate",
  "businessName": "guess or empty",
  "goal": "one sentence",
  "brandFeeling": "short feeling words",
  "colors": "color description",
  "sections": ["Hero", "Features", "..."],
  "summary": "2 sentences describing the layout and vibe"
}`;

  for (const visionModel of [...new Set(visionModels)]) {
    try {
      const completion = await client.chat.completions.create({
        model: visionModel,
        max_tokens: 700,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      });
      const text = completion.choices[0]?.message?.content?.trim();
      if (!text) continue;
      const parsed = VisionBriefSchema.safeParse(parseJsonObject(text));
      if (!parsed.success) continue;

      const d = parsed.data;
      const answers: Partial<CreateWizardAnswers> = {
        ...EMPTY_CREATE_ANSWERS,
        websiteType: d.websiteType,
        industry: d.industry,
        industryCustom: d.industry,
        style: d.style,
        businessName: d.businessName || "",
        goal: d.goal || "",
        brandFeeling: d.brandFeeling || "",
        colors: d.colors || "",
        extraDetails: [
          d.summary,
          d.sections?.length
            ? `Sections seen: ${d.sections.join(", ")}`
            : "",
          "Rebuild inspired by uploaded screenshot (not a pixel clone).",
        ]
          .filter(Boolean)
          .join("\n"),
      };

      return {
        available: true,
        message: "Screenshot analyzed — review the answers, then see the AI plan.",
        answers,
        summary: d.summary || "Layout captured from screenshot.",
        suggestedSections: d.sections || [],
        model: visionModel,
      };
    } catch {
      // try next model
    }
  }

  return {
    available: false,
    message:
      "Vision models were unavailable. Describe the site manually — create wizard still works without screenshots.",
    answers: {},
    summary: "",
    suggestedSections: [],
  };
}
