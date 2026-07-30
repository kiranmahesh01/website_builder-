import { Suspense } from "react";
import { BuilderEntry } from "./builder-entry";

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-ink text-mist">
          Opening Magic AI…
        </main>
      }
    >
      <BuilderEntry />
    </Suspense>
  );
}
