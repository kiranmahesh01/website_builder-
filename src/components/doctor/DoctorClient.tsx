"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";

type DoctorAudit = {
  url?: string;
  title?: string;
  headings: string[];
  scores: {
    overall: number;
    seo: number;
    content: number;
    conversion: number;
    trust: number;
    structure: number;
  };
  problems: {
    severity: string;
    area: string;
    message: string;
    fix: string;
  }[];
  summary: string;
  fixBrief: string;
  industryGuess: string;
};

export function DoctorClient() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [audit, setAudit] = useState<DoctorAudit | null>(null);
  const [shotMsg, setShotMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function runAudit(payload: {
    url?: string;
    screenshotSummary?: string;
  }) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { audit?: DoctorAudit; error?: string };
      if (!res.ok || !data.audit) {
        setError(data.error || "Audit failed");
        return;
      }
      setAudit(data.audit);
    } catch {
      setError("Network error during audit");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = url.trim();
    if (!value) return;
    void runAudit({ url: value.startsWith("http") ? value : `https://${value}` });
  }

  async function onScreenshot(file: File) {
    setShotMsg("Reading screenshot…");
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/agent/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      });
      const data = (await res.json()) as {
        summary?: string;
        message?: string;
        available?: boolean;
      };
      const summary =
        data.summary ||
        data.message ||
        "Screenshot uploaded — visual hierarchy likely weak; rebuild with Magic Blueprint.";
      setShotMsg(summary);
      await runAudit({
        url: url.trim() || undefined,
        screenshotSummary: summary,
      });
    } catch {
      setShotMsg("Could not analyze image — paste a URL instead.");
      setBusy(false);
    }
  }

  return (
    <main className="bg-atmosphere min-h-screen px-4 py-8 text-fog sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="font-[family-name:var(--font-brand)] text-2xl italic"
          >
            magic ai
          </Link>
          <Link href="/create" className="text-sm text-mist hover:text-fog">
            Create
          </Link>
        </div>

        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-mist">
          AI Website Doctor
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
          Diagnose any site. Fix it with Magic.
        </h1>
        <p className="mt-3 text-sm text-mist">
          Paste a URL or upload a screenshot. Get health scores, problems, and a
          one-click path into Magic Blueprint → build.
        </p>

        <form onSubmit={onSubmit} className="mt-8 flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-ink-soft px-4 py-3 text-sm outline-none focus:border-lime/40"
          />
          <button
            type="submit"
            disabled={busy || !url.trim()}
            className="rounded-full bg-lime px-5 py-3 text-sm font-semibold text-ink disabled:opacity-40"
          >
            {busy ? "Auditing…" : "Audit"}
          </button>
        </form>

        <div className="mt-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onScreenshot(f);
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="text-xs text-lime underline-offset-2 hover:underline disabled:opacity-40"
          >
            Or upload a screenshot
          </button>
          {shotMsg ? (
            <p className="mt-1 text-[11px] text-mist">{shotMsg}</p>
          ) : null}
        </div>

        {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

        {audit ? (
          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-[var(--line)] bg-ink-soft p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-mist">
                Health score
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-lime">
                {audit.scores.overall}/100
              </p>
              <p className="mt-2 text-sm text-mist">{audit.summary}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {(
                  [
                    ["SEO", audit.scores.seo],
                    ["Content", audit.scores.content],
                    ["Conversion", audit.scores.conversion],
                    ["Trust", audit.scores.trust],
                    ["Structure", audit.scores.structure],
                  ] as const
                ).map(([label, n]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[var(--line)] px-2 py-2 text-center"
                  >
                    <p className="text-[10px] text-mist">{label}</p>
                    <p className="text-sm font-semibold text-fog">{n}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-ink-soft p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-mist">
                Problems
              </p>
              <ul className="mt-3 space-y-3">
                {audit.problems.map((p, i) => (
                  <li key={`${p.area}-${i}`}>
                    <p className="text-sm text-fog">
                      <span className="text-coral">{p.severity}</span> · {p.area}:{" "}
                      {p.message}
                    </p>
                    <p className="text-xs text-mist">Fix: {p.fix}</p>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href={`/create?prompt=${encodeURIComponent(audit.fixBrief.slice(0, 1800))}&step=2`}
              className="inline-flex rounded-full bg-lime px-6 py-3 text-sm font-semibold text-ink"
            >
              Fix automatically with Magic
            </Link>
            <p className="text-xs text-mist">
              Opens create with an expert brief from this audit ({audit.industryGuess}{" "}
              DNA). You’ll see the Magic Blueprint before generate.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
