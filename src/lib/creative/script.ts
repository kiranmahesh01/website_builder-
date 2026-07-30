import { generateWithOpenRouter } from "@/lib/llm/openrouter";
import { extractJsonObject } from "@/lib/llm/types";
import { nanoid } from "nanoid";
import {
  creativeScriptSchema,
  type CreativeScript,
} from "./schema";

const SCRIPT_SYSTEM = `You are Magic AI Creative Director. Write a short promotional video script as JSON.

Rules:
- 8-10 scenes, 10-20 second total runtime
- Mark exactly 3 scenes with "animate": true (the most dynamic moments — hero reveal, product/action, closing CTA)
- Each scene needs: narration (1-2 sentences for voiceover), visualPrompt (for AI image gen), shotType (wide/medium/close), durationSec (2-8)
- Match the brand brief exactly — use business name, city, services
- Commercial, polished tone. No markdown.

Return JSON:
{
  "title": "video title",
  "brand": "brand name",
  "styleNotes": "overall visual direction",
  "scenes": [
    {
      "id": "scene-1",
      "sceneNumber": 1,
      "durationSec": 4,
      "narration": "...",
      "visualPrompt": "...",
      "shotType": "wide",
      "animate": false
    }
  ]
}`;

export async function generateCreativeScript(input: {
  prompt: string;
  referenceStyle?: string;
  referenceImageUrl?: string;
}): Promise<CreativeScript> {
  const styleBlock = input.referenceStyle
    ? `\nReference style guide (match this look):\n${input.referenceStyle}`
    : "";

  const messages = [
    { role: "system" as const, content: SCRIPT_SYSTEM },
    {
      role: "user" as const,
      content: `Brief:\n${input.prompt}${styleBlock}\n\nWrite the script JSON.`,
    },
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await generateWithOpenRouter(messages, { maxTokens: 3500, json: true });
    const json = extractJsonObject(raw) as Record<string, unknown> | null;
    if (!json) continue;

    const scenes = Array.isArray(json.scenes)
      ? json.scenes.map((s: Record<string, unknown>, i: number) => ({
          id: String(s.id || `scene-${i + 1}`),
          sceneNumber: Number(s.sceneNumber) || i + 1,
          durationSec: Math.min(8, Math.max(2, Number(s.durationSec) || 4)),
          narration: String(s.narration || ""),
          visualPrompt: String(s.visualPrompt || input.prompt),
          shotType: (["wide", "medium", "close"].includes(String(s.shotType))
            ? s.shotType
            : "medium") as "wide" | "medium" | "close",
          animate: Boolean(s.animate),
        }))
      : [];

    const parsed = creativeScriptSchema.safeParse({
      title: json.title || "Brand Video",
      brand: json.brand || "Brand",
      styleNotes: json.styleNotes || input.referenceStyle || "",
      referenceImageUrl: input.referenceImageUrl,
      referenceStyle: input.referenceStyle,
      scenes,
    });

    if (parsed.success) {
      const animateCount = parsed.data.scenes.filter((s) => s.animate).length;
      if (animateCount === 0 && parsed.data.scenes.length >= 3) {
        parsed.data.scenes[1].animate = true;
        parsed.data.scenes[3].animate = true;
        parsed.data.scenes[parsed.data.scenes.length - 1].animate = true;
      }
      return parsed.data;
    }
  }

  return fallbackScript(input.prompt, input.referenceStyle, input.referenceImageUrl);
}

function fallbackScript(
  prompt: string,
  referenceStyle?: string,
  referenceImageUrl?: string,
): CreativeScript {
  const brand = prompt.split("—")[0]?.trim() || prompt.split(" ").slice(0, 2).join(" ");
  const scenes = [
    {
      id: nanoid(8),
      sceneNumber: 1,
      durationSec: 4,
      narration: `Welcome to ${brand}.`,
      visualPrompt: `${brand}, establishing wide shot, ${prompt}`,
      shotType: "wide" as const,
      animate: false,
    },
    {
      id: nanoid(8),
      sceneNumber: 2,
      durationSec: 5,
      narration: `Here's what makes us different.`,
      visualPrompt: `${brand}, hero product or service detail, ${prompt}`,
      shotType: "medium" as const,
      animate: true,
    },
    {
      id: nanoid(8),
      sceneNumber: 3,
      durationSec: 4,
      narration: `Trusted by customers every day.`,
      visualPrompt: `${brand}, happy customers, warm lighting`,
      shotType: "medium" as const,
      animate: false,
    },
    {
      id: nanoid(8),
      sceneNumber: 4,
      durationSec: 5,
      narration: `Experience the difference for yourself.`,
      visualPrompt: `${brand}, action shot, dynamic composition`,
      shotType: "close" as const,
      animate: true,
    },
    {
      id: nanoid(8),
      sceneNumber: 5,
      durationSec: 4,
      narration: `Visit us today.`,
      visualPrompt: `${brand}, call to action, logo moment`,
      shotType: "wide" as const,
      animate: true,
    },
  ];

  return {
    title: `${brand} Promo`,
    brand,
    styleNotes: referenceStyle || "Warm commercial style",
    referenceImageUrl,
    referenceStyle,
    scenes,
  };
}
