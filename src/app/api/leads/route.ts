import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  message: z.string().min(1).max(4000),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { slug: parsed.data.slug, published: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const lead = await prisma.lead.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message,
        projectId: project.id,
        userId: project.userId,
      },
    });

    return NextResponse.json({ ok: true, id: lead.id });
  } catch (error) {
    console.error("leads error", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leads = await prisma.lead.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      project: { select: { title: true, slug: true } },
    },
  });

  return NextResponse.json({ leads });
}
