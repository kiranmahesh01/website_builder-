"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Legacy onboarding — redirected to the structured /create wizard. */
export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/create");
  }, [router]);

  return (
    <main className="bg-atmosphere flex min-h-screen flex-col items-center justify-center px-6 text-fog">
      <Link
        href="/create"
        className="font-[family-name:var(--font-brand)] text-2xl italic"
      >
        magic ai
      </Link>
      <p className="mt-6 text-sm text-mist">Taking you to the create wizard…</p>
      <Link
        href="/create"
        className="mt-4 rounded-full bg-lime px-6 py-2.5 text-sm font-semibold text-ink"
      >
        Continue
      </Link>
    </main>
  );
}
