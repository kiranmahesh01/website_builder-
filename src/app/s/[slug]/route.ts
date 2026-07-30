import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const project = await prisma.project.findFirst({
    where: { slug, published: true },
    select: { html: true, title: true },
  });

  if (!project?.html) {
    return new NextResponse("Site not found", { status: 404 });
  }

  return new NextResponse(project.html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60",
      "X-Magic-AI-Site": project.title,
    },
  });
}
