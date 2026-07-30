"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const suggestions = [
  "Vintage vinyl record shop in Nashville with events calendar",
  "Freelance illustrator portfolio — bold colors, case studies",
  "Neighborhood bakery with online cake orders and pickup",
  "B2B analytics startup landing page with pricing table",
];

export function HeroPrompt() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = prompt.trim();
    if (!value) return;
    router.push(`/builder?prompt=${encodeURIComponent(value)}`);
  }

  return (
    <div className="mx-auto w-full max-w-3xl animate-rise-delay-2">
      <form onSubmit={onSubmit} className="prompt-shell animate-glow">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your business in a sentence — name, offer, city, vibe…"
          aria-label="Website brief"
        />
        <button
          type="submit"
          className="rounded-full bg-lime px-6 py-3 text-sm font-semibold text-ink transition hover:bg-lime-deep"
        >
          Generate
        </button>
      </form>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setPrompt(s)}
            className="rounded-full border border-[var(--line)] bg-[var(--glass)] px-3 py-1.5 text-xs text-mist transition hover:border-lime/40 hover:text-fog"
          >
            {s}
          </button>
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-mist">
        Free to start — no API keys.{" "}
        <Link href="/login" className="text-lime underline-offset-2 hover:underline">
          Log in
        </Link>{" "}
        to save and publish.
      </p>
    </div>
  );
}
