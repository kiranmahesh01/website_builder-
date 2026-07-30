import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  runCreativePipeline,
  serializeCreativeData,
} from "@/lib/creative/pipeline";

export const maxDuration = 300;

const schema = z.object({
  prompt: z.string().min(3).max(4000),
  referenceImageUrl: z.string().url().optional(),
  creativeId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const title =
    parsed.data.prompt.split("—")[0]?.trim().slice(0, 80) ||
    parsed.data.prompt.slice(0, 80);

  let creative = parsed.data.creativeId
    ? await prisma.creativeProject.findFirst({
        where: { id: parsed.data.creativeId, userId: session.user.id },
      })
    : null;

  if (!creative) {
    creative = await prisma.creativeProject.create({
      data: {
        title,
        prompt: parsed.data.prompt,
        referenceImageUrl: parsed.data.referenceImageUrl,
        status: "running",
        userId: session.user.id,
      },
    });
  } else {
    creative = await prisma.creativeProject.update({
      where: { id: creative.id },
      data: {
        status: "running",
        error: null,
        referenceImageUrl:
          parsed.data.referenceImageUrl || creative.referenceImageUrl,
      },
    });
  }

  try {
    const result = await runCreativePipeline({
      prompt: parsed.data.prompt,
      referenceImageUrl:
        parsed.data.referenceImageUrl || creative.referenceImageUrl || undefined,
    });

    const updated = await prisma.creativeProject.update({
      where: { id: creative.id },
      data: {
        title: result.script.title,
        status: "ready",
        data: serializeCreativeData(result.data),
        outputUrl: result.outputUrl,
        voiceoverUrl: result.voiceoverUrl,
        error: null,
      },
    });

    return NextResponse.json({ creative: updated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Creative generation failed";

    await prisma.creativeProject.update({
      where: { id: creative.id },
      data: { status: "error", error: message },
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
