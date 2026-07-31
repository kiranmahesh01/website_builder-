import { Suspense } from "react";
import { CreateWizard } from "@/components/create/CreateWizard";

export const metadata = {
  title: "Create — Magic AI Blueprint",
  description:
    "Tell Magic AI your business idea. Get a Magic Blueprint — analysis, strategy, structure, design system — then build and launch.",
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
