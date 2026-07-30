import Link from "next/link";

export const metadata = {
  title: "Pricing — Magic AI",
  description: "Magic AI is free to use. Generate, preview, and publish websites at no cost.",
};

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    highlight: true,
    features: [
      "Unlimited site previews",
      "AI generation included — no API keys",
      "DaisyUI, shadcn, Preline & Flowbite kits",
      "Publish to a Magic AI URL",
      "Chat to refine copy & sections",
      "Save projects to your account",
    ],
    cta: "Start free",
    href: "/signup",
  },
  {
    name: "Pro",
    price: "Soon",
    period: "",
    highlight: false,
    features: [
      "Custom domain connect",
      "Remove Magic AI branding",
      "Priority generation",
      "Team workspaces",
      "Version history export",
    ],
    cta: "Join waitlist",
    href: "/signup",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-atmosphere">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-[family-name:var(--font-brand)] text-2xl italic text-fog">
          magic ai
        </Link>
        <Link href="/" className="text-sm text-mist hover:text-fog">
          ← Home
        </Link>
      </header>

      <div className="mx-auto max-w-4xl px-6 pb-24 pt-8 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold sm:text-5xl">
          Simple pricing
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-mist">
          Magic AI is free today. We cover generation so you don&apos;t need OpenAI keys
          or a credit card to try it.
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-2 text-left">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className={`rounded-2xl border p-8 ${
                tier.highlight
                  ? "border-lime/50 bg-lime/5"
                  : "border-[var(--line)] bg-ink-soft/30"
              }`}
            >
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                {tier.name}
              </h2>
              <p className="mt-4">
                <span className="text-4xl font-bold">{tier.price}</span>
                {tier.period ? (
                  <span className="text-mist"> / {tier.period}</span>
                ) : null}
              </p>
              <ul className="mt-6 space-y-2 text-sm text-mist">
                {tier.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <Link
                href={tier.href}
                className={`mt-8 inline-flex rounded-full px-6 py-2.5 text-sm font-semibold ${
                  tier.highlight
                    ? "bg-lime text-ink hover:bg-lime-deep"
                    : "border border-[var(--line)] text-fog hover:border-lime/40"
                }`}
              >
                {tier.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
