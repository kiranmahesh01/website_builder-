import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ host: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { host } = await params;
  const domain = decodeURIComponent(host)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  const project = await prisma.project.findFirst({
    where: { customDomain: domain, published: true },
    select: { html: true, title: true, id: true, slug: true },
  });

  if (!project?.html) {
    return new NextResponse(
      `No published Magic AI site for domain: ${domain}`,
      { status: 404 },
    );
  }

  await prisma.project.update({
    where: { id: project.id },
    data: { viewCount: { increment: 1 } },
  });

  return new NextResponse(project.html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Magic-AI-Site": project.title,
      "X-Magic-AI-Slug": project.slug || "",
    },
  });
}
