"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const suggestions = [
  "Online orchid boutique with shop and pickup",
  "Minimal portfolio for a product designer",
  "Local coffee roastery with menu and map",
  "SaaS landing page for a productivity app",
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
          placeholder="What kind of website do you want to build?"
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
        Already have an account?{" "}
        <Link href="/login" className="text-lime underline-offset-2 hover:underline">
          Log in
        </Link>{" "}
        to publish and save projects.
      </p>
    </div>
  );
}
