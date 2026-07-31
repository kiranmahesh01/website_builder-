import Link from "next/link";
import { BENCHMARK_PROMPTS } from "@/lib/benchmark-prompts";
import {
  COMPETITORS,
  FEATURE_MATRIX,
  MAGIC_AI_WINS,
} from "@/lib/competitors";

function cellValue(val: boolean | string): string {
  if (val === true) return "✓";
  if (val === false) return "—";
  return String(val);
}

function PromptCard({
  slug,
  title,
  category,
  prompt,
}: {
  slug: string;
  title: string;
  category: string;
  prompt: string;
}) {
  return (
    <article className="flex flex-col">
      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-ink-soft shadow-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-3 py-2">
          <span className="ml-2 truncate text-[10px] text-mist">Magic AI · {slug}</span>
          <span className="text-[10px] uppercase tracking-wider text-lime">{category}</span>
        </div>
        <div className="relative aspect-[16/10] bg-white">
          <iframe
            title={`Magic AI preview: ${title}`}
            src={`/examples/${slug}`}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
      <p className="mt-3 font-mono text-xs text-mist">{prompt}</p>
    </article>
  );
}

export default function ComparePage() {
  const highlightIds = COMPETITORS.map((c) => c.id);

  return (
    <main className="bg-atmosphere min-h-screen flex-1">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-brand)] text-3xl italic tracking-tight text-fog"
        >
          magic ai
        </Link>
        <Link
          href="/create"
          className="rounded-full bg-fog px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-white"
        >
          Try free
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-8 pt-4">
        <p className="text-sm uppercase tracking-[0.2em] text-lime">Competitive matrix</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-fog sm:text-5xl">
          Magic AI vs every major AI builder
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-mist">
          Wegic, DreamHost Remixer, Sketchflow, Framer, Durable, PressGo — tested side by side.
          Magic AI combines Wegic&apos;s chat simplicity with Sketchflow&apos;s code export and
          Durable&apos;s lead capture, without platform lock-in.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMPETITORS.map((c) => (
            <article
              key={c.id}
              className={`rounded-2xl border p-5 ${
                c.id === "magic-ai"
                  ? "border-lime/40 bg-lime/5"
                  : "border-[var(--line)] bg-ink-soft/50"
              }`}
            >
              <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-fog">
                {c.name}
                {c.id === "magic-ai" ? (
                  <span className="ml-2 text-xs font-normal text-lime">you are here</span>
                ) : null}
              </h3>
              <p className="mt-2 text-sm text-mist">{c.tagline}</p>
              <p className="mt-3 text-xs text-mist/80">
                <span className="text-fog">Best for:</span> {c.bestFor}
              </p>
              <p className="mt-1 text-xs italic text-mist/70">{c.vibe}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--line)] py-16">
        <div className="mx-auto max-w-6xl overflow-x-auto px-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Feature comparison
          </h2>
          <table className="mt-8 w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-xs uppercase tracking-wider text-mist">
                <th className="px-3 py-3 font-medium">Feature</th>
                {COMPETITORS.map((c) => (
                  <th
                    key={c.id}
                    className={`px-3 py-3 font-medium ${c.id === "magic-ai" ? "text-lime" : ""}`}
                  >
                    {c.name.replace("DreamHost ", "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_MATRIX.map((row) => (
                <tr key={row.feature} className="border-b border-[var(--line)]">
                  <td className="px-3 py-3 text-fog">{row.feature}</td>
                  {highlightIds.map((id) => (
                    <td
                      key={id}
                      className={`px-3 py-3 ${id === "magic-ai" ? "text-lime" : "text-mist"}`}
                    >
                      {cellValue(row.values[id])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-t border-[var(--line)] py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Where Magic AI wins
          </h2>
          <ul className="mt-6 space-y-3">
            {MAGIC_AI_WINS.map((item) => (
              <li key={item} className="flex gap-3 text-mist">
                <span className="text-lime">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-[var(--line)] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Benchmark sites (test these on any competitor)
          </h2>
          <div className="mt-10 grid gap-10 lg:grid-cols-3">
            {BENCHMARK_PROMPTS.map((item) => (
              <PromptCard key={item.slug} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] py-16 text-center">
        <div className="mx-auto max-w-xl px-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-fog">
            Try Magic AI free
          </h2>
          <p className="mt-3 text-mist">
            Chat builder · React/Astro/WordPress export · Lead inbox · Promo video studio
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/create"
              className="rounded-full bg-lime px-8 py-3 text-sm font-semibold text-ink"
            >
              Build a site
            </Link>
            <Link
              href="/studio"
              className="rounded-full border border-[var(--line)] px-8 py-3 text-sm font-semibold text-fog"
            >
              Creative Studio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
