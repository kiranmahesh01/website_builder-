import Link from "next/link";
import { auth } from "@/lib/auth";
import { HeroPrompt } from "@/components/HeroPrompt";
import { LandingFaq } from "@/components/LandingFaq";
import { ShowcaseGallery } from "@/components/ShowcaseGallery";

const included = [
  { label: "Navigation", detail: "Logo, links, mobile-ready header" },
  { label: "Hero", detail: "Headline, subtext, and primary CTA" },
  { label: "Features", detail: "Selling points in a scannable grid" },
  { label: "Pricing", detail: "Plans or packages when your brief needs them" },
  { label: "Testimonials", detail: "Social proof block with quotes" },
  { label: "Contact", detail: "Form, email, phone, or booking CTA" },
];

const comparisons = [
  { them: "Pick a template, swap placeholder text", us: "Describe your business — we compose the page" },
  { them: "Drag blocks for an hour", us: "Preview a full site in under a minute" },
  { them: "Bring your own API keys", us: "Generation included — sign up and go" },
  { them: "Generic “welcome to our website” copy", us: "Brief parser pushes your name, city, and offer" },
];

const testimonials = [
  {
    quote: "I described my taco truck in one sentence and had a menu page before my coffee cooled.",
    name: "Marco R.",
    role: "Food truck owner",
  },
  {
    quote: "The shadcn kit made my freelance portfolio look like I paid an agency. I didn't touch CSS.",
    name: "Priya S.",
    role: "Brand designer",
  },
  {
    quote: "Finally a builder that doesn't ask me for an API key. I just typed and published.",
    name: "James L.",
    role: "Gym owner",
  },
  {
    quote: "Our yoga studio site has class times and an intro offer — exactly what I asked for.",
    name: "Elena K.",
    role: "Studio owner",
  },
  {
    quote: "I showed the live link to a client the same afternoon. That never happened with WordPress.",
    name: "David M.",
    role: "Marketing consultant",
  },
  {
    quote: "The examples on the homepage convinced me to try it. My bakery site matched that quality.",
    name: "Sofia T.",
    role: "Bakery owner",
  },
  {
    quote: "Chat refinement is the killer feature. I said ‘make the hero warmer’ and it actually did.",
    name: "Alex W.",
    role: "Coffee roaster",
  },
];

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="bg-atmosphere flex-1">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-brand)] text-3xl italic tracking-tight text-fog"
        >
          magic ai
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/templates" className="hidden text-mist hover:text-fog sm:inline">
            Templates
          </Link>
          <Link href="/pricing" className="hidden text-mist hover:text-fog sm:inline">
            Pricing
          </Link>
          <Link href="#faq" className="hidden text-mist hover:text-fog sm:inline">
            FAQ
          </Link>
          {session?.user ? (
            <>
              <Link href="/dashboard" className="hidden text-mist hover:text-fog sm:inline">
                Dashboard
              </Link>
              <Link
                href="/onboarding"
                className="rounded-full bg-fog px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-white"
              >
                Open builder
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden text-mist hover:text-fog sm:inline">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-fog px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-white"
              >
                Start free
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto flex min-h-[72vh] w-full max-w-5xl flex-col items-center justify-center px-6 pb-16 pt-8 text-center">
        <p className="animate-rise mb-4 text-sm uppercase tracking-[0.22em] text-mist">
          Free AI website builder
        </p>
        <h1 className="animate-rise font-[family-name:var(--font-display)] text-5xl font-extrabold leading-[1.05] tracking-tight text-fog sm:text-6xl lg:text-7xl">
          Your business in a sentence.{" "}
          <span className="text-lime">Your website in minutes.</span>
        </h1>
        <p className="animate-rise-delay mx-auto mt-6 max-w-2xl text-lg text-mist">
          Type what you do — name, offer, city, vibe. Magic AI builds structured pages with
          pro UI kits, lets you refine in chat, and publishes to a live URL. No code. No API
          keys. Free to start.
        </p>
        <div className="mt-10 w-full">
          <HeroPrompt />
        </div>
      </section>

      <ShowcaseGallery />

      <section className="border-t border-[var(--line)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
            What every generated site includes
          </h2>
          <p className="mt-3 max-w-2xl text-mist">
            Not a blank canvas. Typed sections — hero, features, pricing, contact — rendered
            through DaisyUI, shadcn, Preline, or Flowbite.
          </p>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {included.map((item) => (
              <article
                key={item.label}
                className="rounded-xl border border-[var(--line)] bg-ink-soft/40 px-5 py-4"
              >
                <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-lime">
                  {item.label}
                </h3>
                <p className="mt-1 text-sm text-mist">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
            Template builders vs Magic AI
          </h2>
          <div className="mt-12 overflow-hidden rounded-2xl border border-[var(--line)]">
            <div className="grid grid-cols-2 border-b border-[var(--line)] bg-ink-soft/60 text-xs uppercase tracking-wider text-mist">
              <div className="px-5 py-3">Typical builder</div>
              <div className="border-l border-[var(--line)] px-5 py-3 text-lime">Magic AI</div>
            </div>
            {comparisons.map((row) => (
              <div
                key={row.them}
                className="grid grid-cols-2 border-b border-[var(--line)] last:border-b-0"
              >
                <div className="px-5 py-4 text-sm text-mist">{row.them}</div>
                <div className="border-l border-[var(--line)] px-5 py-4 text-sm text-fog">
                  {row.us}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
            What early users say
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <blockquote
                key={t.name}
                className="rounded-2xl border border-[var(--line)] bg-ink-soft/50 p-6"
              >
                <p className="text-sm leading-relaxed text-fog">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-4 text-xs text-mist">
                  <span className="font-semibold text-fog">{t.name}</span> · {t.role}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <LandingFaq />

      <section className="border-t border-[var(--line)] py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl">
            Ready to see yours?
          </h2>
          <p className="mt-4 text-mist">
            Free account. AI generation included. Publish to a live Magic AI link when
            you&apos;re happy — no credit card, no developer setup.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href={session?.user ? "/onboarding" : "/signup"}
              className="inline-flex rounded-full bg-lime px-8 py-3.5 text-sm font-semibold text-ink transition hover:bg-lime-deep"
            >
              Start building free
            </Link>
            <Link
              href="/templates"
              className="inline-flex rounded-full border border-[var(--line)] px-8 py-3.5 text-sm font-semibold text-fog transition hover:border-lime/40"
            >
              Browse examples
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--line)] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <span className="font-[family-name:var(--font-brand)] text-xl italic text-fog">
            magic ai
          </span>
          <nav className="flex flex-wrap justify-center gap-4 text-xs text-mist">
            <Link href="/templates" className="hover:text-fog">
              Templates
            </Link>
            <Link href="/pricing" className="hover:text-fog">
              Pricing
            </Link>
            <Link href="#examples" className="hover:text-fog">
              Examples
            </Link>
            <Link href="#faq" className="hover:text-fog">
              FAQ
            </Link>
          </nav>
          <p className="text-xs text-mist">
            © {new Date().getFullYear()} Magic AI · Free to use · No API keys required
          </p>
        </div>
      </footer>
    </main>
  );
}
