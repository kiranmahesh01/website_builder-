import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CreativeStudio } from "@/components/CreativeStudio";

export default async function StudioPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/studio");
  }

  return <CreativeStudio />;
}
