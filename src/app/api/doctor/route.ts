import { NextResponse } from "next/server";
import { z } from "zod";
import { auditWebsite } from "@/lib/doctor";

export const runtime = "nodejs";
export const maxDuration = 30;

const schema = z.object({
  url: z.string().url().optional(),
  htmlHint: z.string().max(400_000).optional(),
  screenshotSummary: z.string().max(2000).optional(),
});

/**
 * AI Website Doctor — paste URL and/or screenshot summary → health scores,
 * problems, and a fix brief for Magic create/generate.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Provide a valid url and/or htmlHint / screenshotSummary" },
        { status: 400 },
      );
    }
    if (
      !parsed.data.url &&
      !parsed.data.htmlHint &&
      !parsed.data.screenshotSummary
    ) {
      return NextResponse.json(
        { error: "Provide a url, htmlHint, or screenshotSummary" },
        { status: 400 },
      );
    }

    const audit = await auditWebsite(parsed.data);
    return NextResponse.json({ audit });
  } catch (error) {
    console.error("doctor audit error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Website doctor failed",
      },
      { status: 500 },
    );
  }
}
