import { Suspense } from "react";
import { CreateWizard } from "@/components/create/CreateWizard";

export const metadata = {
  title: "Create a website — Magic AI",
  description:
    "Guided create wizard: website type, industry, style, AI plan, and template pick before generate.",
};

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <main className="bg-atmosphere flex min-h-screen items-center justify-center text-mist">
          Loading create wizard…
        </main>
      }
    >
      <CreateWizard />
    </Suspense>
  );
}
