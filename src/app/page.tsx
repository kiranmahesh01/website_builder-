import Link from "next/link";
import { auth } from "@/lib/auth";
import { HeroPrompt } from "@/components/HeroPrompt";

const features = [
  {
    title: "AI coding",
    body: "Magic AI writes structure, design, and copy from a short brief — powered by OpenAI or Gemini.",
  },
  {
    title: "Chat to refine",
    body: "Tune layout, colors, sections, and SEO in plain language. Preview updates live.",
  },
  {
    title: "One-click publish",
    body: "Launch a live URL instantly. Share it, iterate, and republish whenever you are ready.",
  },
];

const steps = [
  {
    n: "01",
    title: "Chat to start",
    body: "Describe your business, audience, and style. No templates to hunt through.",
  },
  {
    n: "02",
    title: "Generate & fine-tune",
    body: "Magic AI builds a full page. Ask for changes until it feels like your brand.",
  },
  {
    n: "03",
    title: "Publish",
    body: "Hit Publish once. Your site goes live on a Magic AI URL in one click.",
  },
];

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="bg-atmosphere flex-1">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-[family-name:var(--font-brand)] text-3xl italic tracking-tight text-fog">
          magic ai
        </Link>
        <nav className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden text-sm text-mist transition hover:text-fog sm:inline"
              >
                Dashboard
              </Link>
              <Link
                href="/builder"
                className="rounded-full bg-fog px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-white"
              >
                Start building
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm text-mist transition hover:text-fog sm:inline"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-fog px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-white"
              >
                Start building
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto flex min-h-[78vh] w-full max-w-5xl flex-col items-center justify-center px-6 pb-20 pt-10 text-center">
        <p className="animate-rise mb-4 text-sm uppercase tracking-[0.22em] text-mist">
          AI website builder
        </p>
        <h1 className="animate-rise font-[family-name:var(--font-display)] text-5xl font-extrabold leading-[1.05] tracking-tight text-fog sm:text-7xl">
          Build a site that{" "}
          <span className="text-lime">grows</span> your business
        </h1>
        <p className="animate-rise-delay mx-auto mt-6 max-w-2xl text-lg text-mist">
          Magic AI is your designer, developer, and publisher. Chat your idea,
          generate a custom website with real LLMs, and go live in one click —
          no code required.
        </p>
        <div className="mt-10 w-full">
          <HeroPrompt />
        </div>
      </section>

      <section className="border-t border-[var(--line)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
            Built for real business goals
          </h2>
          <p className="mt-3 max-w-xl text-mist">
            Promote your brand, sell products, or turn visitors into customers —
            Magic AI structures the page around the outcome you need.
          </p>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {features.map((f) => (
              <article key={f.title}>
                <div className="mb-4 h-1 w-12 bg-lime" />
                <h3 className="font-[family-name:var(--font-display)] text-xl font-bold">
                  {f.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-mist">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
            How to create with Magic AI
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <article key={s.n} className="relative">
                <span className="font-[family-name:var(--font-display)] text-5xl font-extrabold text-lime/25">
                  {s.n}
                </span>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold">
                  {s.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-mist">{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl">
            It&apos;s your turn to build
          </h2>
          <p className="mt-4 text-mist">
            OpenAI and Gemini under the hood. Auth to save your work. Publish
            when it feels right.
          </p>
          <Link
            href={session?.user ? "/builder" : "/signup"}
            className="mt-8 inline-flex rounded-full bg-lime px-8 py-3.5 text-sm font-semibold text-ink transition hover:bg-lime-deep"
          >
            Get started free
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--line)] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <span className="font-[family-name:var(--font-brand)] text-xl italic text-fog">
            magic ai
          </span>
          <p className="text-xs text-mist">
            Magic AI © {new Date().getFullYear()}. Chat · Generate · Publish.
          </p>
        </div>
      </footer>
    </main>
  );
}
