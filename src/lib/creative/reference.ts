import OpenAI from "openai";
import { generateWithOpenRouter } from "@/lib/llm/openrouter";
import {
  FREE_OPENROUTER_MODELS,
  openRouterVisionModel,
} from "@/lib/llm/openrouter-models";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export async function analyzeReferenceImage(
  imageUrl: string,
  brandContext: string,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return "Clean commercial style, soft natural lighting, brand-aligned backdrop.";
  }

  const client = new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE,
    defaultHeaders: {
      "HTTP-Referer":
        process.env.AUTH_URL || "https://websitebuilder-main.vercel.app",
      "X-Title": "Magic AI Creative",
    },
  });

  const visionModels = [
    openRouterVisionModel(),
    ...FREE_OPENROUTER_MODELS.filter((m) => m.includes("gemma")),
  ];

  for (const visionModel of [...new Set(visionModels)]) {
    try {
      const completion = await client.chat.completions.create({
        model: visionModel,
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this reference image for a brand video creative. Brand context: ${brandContext}

Return a concise style guide (2-4 sentences) covering: color palette, lighting, backdrop/setting, mood, and how to adapt models/subjects so they don't look like real identifiable people. No markdown.`,
              },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
      });

      const text = completion.choices[0]?.message?.content?.trim();
      if (text) return text;
    } catch {
      // try next vision model
    }
  }

  return "Warm commercial aesthetic with soft lighting and neutral backdrop.";
}

export async function enhanceVisualPrompt(
  basePrompt: string,
  referenceStyle?: string,
): Promise<string> {
  if (!referenceStyle) return basePrompt;

  const messages = [
    {
      role: "system" as const,
      content:
        "You write image generation prompts. Merge the scene description with the reference style. Keep prompts under 120 words. No real celebrity names. Stylized, commercial-safe.",
    },
    {
      role: "user" as const,
      content: `Scene: ${basePrompt}\n\nReference style: ${referenceStyle}`,
    },
  ];

  const raw = await generateWithOpenRouter(messages, { maxTokens: 200 });
  return raw.trim() || basePrompt;
}
