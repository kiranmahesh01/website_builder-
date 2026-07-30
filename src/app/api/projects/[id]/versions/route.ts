import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { snapshotProjectVersion } from "@/lib/versions";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const versions = await prisma.projectVersion.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, label: true, createdAt: true },
  });
  return NextResponse.json({ versions });
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const versionId = body?.versionId as string | undefined;
  if (!versionId) {
    return NextResponse.json({ error: "versionId required" }, { status: 400 });
  }

  const version = await prisma.projectVersion.findFirst({
    where: { id: versionId, projectId: id },
  });
  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  await snapshotProjectVersion(id, "Before restore");
  const updated = await prisma.project.update({
    where: { id },
    data: {
      html: version.html,
      data: version.data,
    },
  });

  return NextResponse.json({
    project: {
      id: updated.id,
      html: updated.html,
      data: updated.data,
    },
  });
}
