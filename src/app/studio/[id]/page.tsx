import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreativeStudio } from "@/components/CreativeStudio";

export default async function StudioProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/studio");
  }

  const { id } = await params;
  const creative = await prisma.creativeProject.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!creative) {
    redirect("/studio");
  }

  return <CreativeStudio creativeId={id} initialPrompt={creative.prompt} />;
}
