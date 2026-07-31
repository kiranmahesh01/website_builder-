import { NextResponse } from "next/server";
import { z } from "zod";
import {
  analyzeScreenshotForWebsite,
  visionAvailable,
} from "@/lib/create/screenshot";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  imageDataUrl: z.string().min(32).max(6_000_000),
  hint: z.string().max(500).optional(),
});

/**
 * Screenshot → structured wizard answers via OpenRouter vision.
 * No auth required (create funnel); degrades clearly without a vision key.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (!visionAvailable()) {
      return NextResponse.json({
        available: false,
        message:
          "Screenshot analysis needs OPENROUTER_API_KEY. Continue with the chat wizard — generation still works.",
        answers: {},
        summary: "",
        suggestedSections: [],
      });
    }

    const result = await analyzeScreenshotForWebsite(
      parsed.data.imageDataUrl,
      parsed.data.hint,
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("screenshot analyze error", error);
    return NextResponse.json(
      {
        available: false,
        message:
          error instanceof Error
            ? error.message
            : "Could not analyze screenshot",
        answers: {},
        summary: "",
        suggestedSections: [],
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ visionAvailable: visionAvailable() });
}
