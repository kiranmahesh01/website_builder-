"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const GOALS = [
  "Promote a brand / portfolio",
  "Sell products or services",
  "Capture leads / bookings",
  "Something unique",
];

const STYLES = [
  { id: "bold", label: "Bold & expressive" },
  { id: "minimal", label: "Minimal & clean" },
  { id: "editorial", label: "Editorial" },
  { id: "warm", label: "Warm & local" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(GOALS[0]);
  const [style, setStyle] = useState(STYLES[0].id);
  const [notes, setNotes] = useState("");

  function finish() {
    const prompt = [
      `Create a website for "${name || "my business"}".`,
      `Primary goal: ${goal}.`,
      `Visual style: ${STYLES.find((s) => s.id === style)?.label || style}.`,
      notes ? `Extra details: ${notes}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    router.push(`/builder?prompt=${encodeURIComponent(prompt)}`);
  }

  return (
    <main className="bg-atmosphere min-h-screen px-6 py-10 text-fog">
      <div className="mx-auto max-w-xl">
        <Link
          href="/"
          className="font-[family-name:var(--font-brand)] text-2xl italic"
        >
          magic ai
        </Link>
        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-mist">
          Guided setup · step {step + 1} of 4
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight">
          {step === 0 && "What’s your site name?"}
          {step === 1 && "What’s the main goal?"}
          {step === 2 && "Pick a visual direction"}
          {step === 3 && "Any extras?"}
        </h1>

        <div className="mt-8 space-y-4">
          {step === 0 ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Azure Retreat, Northbeam Coffee…"
              className="w-full rounded-2xl border border-[var(--line)] bg-ink-soft px-4 py-3 outline-none focus:border-lime/40"
            />
          ) : null}
          {step === 1 ? (
            <div className="space-y-2">
              {GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  className={`block w-full rounded-2xl border px-4 py-3 text-left text-sm ${
                    goal === g
                      ? "border-lime/50 bg-lime/10"
                      : "border-[var(--line)] bg-ink-soft"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          ) : null}
          {step === 2 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`rounded-2xl border px-4 py-4 text-left text-sm ${
                    style === s.id
                      ? "border-lime/50 bg-lime/10"
                      : "border-[var(--line)] bg-ink-soft"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          ) : null}
          {step === 3 ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Pages you need, products, booking, colors to avoid…"
              className="w-full rounded-2xl border border-[var(--line)] bg-ink-soft px-4 py-3 outline-none focus:border-lime/40"
            />
          ) : null}
        </div>

        <div className="mt-8 flex gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-full border border-[var(--line)] px-5 py-2.5 text-sm text-mist"
            >
              Back
            </button>
          ) : null}
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="rounded-full bg-lime px-6 py-2.5 text-sm font-semibold text-ink"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              className="rounded-full bg-lime px-6 py-2.5 text-sm font-semibold text-ink"
            >
              Generate with Magic AI
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
