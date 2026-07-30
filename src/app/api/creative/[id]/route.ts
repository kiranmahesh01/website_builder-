import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseCreativeData } from "@/lib/creative/schema";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const creative = await prisma.creativeProject.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!creative) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    creative: {
      ...creative,
      data: parseCreativeData(creative.data),
    },
  });
}
