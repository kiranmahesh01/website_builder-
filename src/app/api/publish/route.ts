import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { makeSlug } from "@/lib/utils";

const schema = z.object({
  projectId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.html && !project.data) {
      return NextResponse.json(
        { error: "Generate a website before publishing." },
        { status: 400 },
      );
    }

    const slug = project.slug || makeSlug(project.title);
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: {
        published: true,
        slug,
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({
      published: true,
      slug: updated.slug,
      url: `/s/${updated.slug}`,
    });
  } catch (error) {
    console.error("publish error", error);
    return NextResponse.json({ error: "Failed to publish" }, { status: 500 });
  }
}
