const FAQ_ITEMS = [
  {
    q: "Do I need to code?",
    a: "No. Describe your business in plain language. Magic AI builds structured pages — navigation, hero, features, contact — and renders them with professional UI kits.",
  },
  {
    q: "Do I need an OpenAI or API key?",
    a: "No. Magic AI runs generation for you on the free tier. Sign up, write a brief, and generate — no developer setup.",
  },
  {
    q: "How is this different from a template site?",
    a: "Templates give you fixed layouts. Magic AI composes typed sections from your brief — your business name, offer, and tone — then renders with DaisyUI, shadcn, Preline, or Flowbite.",
  },
  {
    q: "Can I publish to a real URL?",
    a: "Yes. One-click publish gives you a live Magic AI link. Custom domains are on the roadmap.",
  },
  {
    q: "Is it really free?",
    a: "Yes. Account, generation, preview, and publish on a Magic AI subdomain are free. We may add optional paid tiers later for custom domains and teams.",
  },
  {
    q: "Who owns the content?",
    a: "You do. The sites you generate are yours to edit, publish, and iterate on.",
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="border-t border-[var(--line)] py-24">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
          Questions, answered
        </h2>
        <dl className="mt-12 space-y-8">
          {FAQ_ITEMS.map((item) => (
            <div key={item.q}>
              <dt className="font-[family-name:var(--font-display)] text-lg font-semibold text-fog">
                {item.q}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-mist">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
