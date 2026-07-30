import Link from "next/link";
import { BENCHMARK_PROMPTS } from "@/lib/benchmark-prompts";
import { IMAGE_PROVIDER_GUIDE } from "@/lib/spec/images";

const WEGIC_FEATURES = [
  { feature: "Chat-to-site generation", magic: true, wegic: true },
  { feature: "One-click publish", magic: true, wegic: true },
  { feature: "No API keys for users", magic: true, wegic: true },
  { feature: "Structured sections (hero, pricing, FAQ)", magic: true, wegic: true },
  { feature: "Chat refinement", magic: true, wegic: true },
  { feature: "Multi-provider stock photos", magic: true, wegic: false },
  { feature: "Free tier without attribution", magic: true, wegic: "varies" },
  { feature: "Open-source / self-hostable", magic: true, wegic: false },
];

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
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-coral/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-lime/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-mist/40" />
            <span className="ml-2 truncate text-[10px] text-mist">Magic AI · {slug}</span>
          </div>
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
      <div className="mt-4">
        <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-fog">
          {title}
        </h3>
        <p className="mt-2 rounded-lg border border-[var(--line)] bg-ink-soft/50 p-3 font-mono text-xs leading-relaxed text-mist">
          {prompt}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <Link
            href={`/examples/${slug}`}
            target="_blank"
            className="text-lime underline-offset-2 hover:underline"
          >
            Open full preview →
          </Link>
          <Link
            href={`/builder?prompt=${encodeURIComponent(prompt)}`}
            className="text-mist underline-offset-2 hover:text-fog hover:underline"
          >
            Regenerate in builder
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function ComparePage() {
  return (
    <main className="bg-atmosphere min-h-screen flex-1">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-brand)] text-3xl italic tracking-tight text-fog"
        >
          magic ai
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/#examples" className="text-mist hover:text-fog">
            Examples
          </Link>
          <Link
            href="/onboarding"
            className="rounded-full bg-fog px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-white"
          >
            Try it free
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-8 pt-4">
        <p className="text-sm uppercase tracking-[0.2em] text-lime">Benchmark</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-fog sm:text-5xl">
          Same three prompts. See the output.
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-mist">
          These are the standard comparison prompts used to evaluate AI website builders —
          bakery, dental clinic, and designer portfolio. Magic AI generated all three below
          from a single sentence each. Paste the same prompts into Wegic&apos;s free tier
          and compare side by side.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-1">
          {BENCHMARK_PROMPTS.map((item) => (
            <PromptCard key={item.slug} {...item} />
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--line)] py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            Magic AI vs Wegic-style builders
          </h2>
          <p className="mt-3 text-mist">
            Both are chat-first AI website builders. Magic AI matches the core Wegic workflow
            — describe your business, preview, refine in chat, publish — without asking users
            for API keys.
          </p>
          <div className="mt-10 overflow-hidden rounded-2xl border border-[var(--line)]">
            <div className="grid grid-cols-3 border-b border-[var(--line)] bg-ink-soft/60 text-xs uppercase tracking-wider text-mist">
              <div className="px-5 py-3">Feature</div>
              <div className="border-l border-[var(--line)] px-5 py-3 text-lime">Magic AI</div>
              <div className="border-l border-[var(--line)] px-5 py-3">Wegic</div>
            </div>
            {WEGIC_FEATURES.map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-3 border-b border-[var(--line)] last:border-b-0"
              >
                <div className="px-5 py-4 text-sm text-fog">{row.feature}</div>
                <div className="border-l border-[var(--line)] px-5 py-4 text-sm text-lime">
                  {row.magic === true ? "✓" : row.magic}
                </div>
                <div className="border-l border-[var(--line)] px-5 py-4 text-sm text-mist">
                  {row.wegic === true ? "✓" : row.wegic === false ? "—" : row.wegic}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            Stock photo APIs we use
          </h2>
          <p className="mt-3 text-mist">
            Generated sites pull real photos through a fallback chain. Pexels and Pixabay are
            the best free options for business sites — no attribution required. Openverse and
            Wikimedia work without any API key.
          </p>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-[var(--line)]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-ink-soft/60 text-xs uppercase tracking-wider text-mist">
                <tr>
                  <th className="px-5 py-3 font-medium">API</th>
                  <th className="px-5 py-3 font-medium">Free limit</th>
                  <th className="px-5 py-3 font-medium">Attribution</th>
                  <th className="px-5 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {IMAGE_PROVIDER_GUIDE.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--line)]">
                    <td className="px-5 py-4 text-fog">
                      {row.name}
                      {row.recommended ? (
                        <span className="ml-2 text-xs text-lime">recommended</span>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-mist">{row.freeLimit}</td>
                    <td className="px-5 py-4 text-mist">{row.attribution}</td>
                    <td className="px-5 py-4 text-mist">
                      {row.notes}
                      {row.envKey ? (
                        <span className="mt-1 block font-mono text-[11px] text-fog/70">
                          {row.envKey}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-fog">
            Run the comparison yourself
          </h2>
          <ol className="mx-auto mt-6 max-w-xl space-y-3 text-left text-sm text-mist">
            <li>1. Open each Magic AI preview above (or regenerate in the builder).</li>
            <li>2. Sign up for Wegic&apos;s free tier at wegic.ai.</li>
            <li>3. Paste the exact same prompt for each business type.</li>
            <li>4. Compare copy quality, layout, images, and mobile feel.</li>
          </ol>
          <Link
            href="/onboarding"
            className="mt-8 inline-block rounded-full bg-lime px-8 py-3 text-sm font-semibold text-ink transition hover:bg-lime/90"
          >
            Build your own site free
          </Link>
        </div>
      </section>
    </main>
  );
}
