import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { availableProviders } from "@/lib/llm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    project: {
      id: project.id,
      title: project.title,
      prompt: project.prompt,
      html: project.html,
      data: project.data,
      provider: project.provider,
      published: project.published,
      slug: project.slug,
    },
    messages: project.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
    })),
    providers: availableProviders(),
  });
}
