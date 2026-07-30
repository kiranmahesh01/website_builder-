import { redirect } from "next/navigation";
import { BuilderWorkspace } from "@/components/BuilderWorkspace";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export default async function BuilderProjectPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/builder/${id}`)}`);
  }

  const owned = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });

  if (!owned) {
    redirect("/dashboard");
  }

  return <BuilderWorkspace projectId={id} />;
}
