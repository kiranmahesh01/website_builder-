import type { Section } from "@/lib/schema";

type NavProps = Extract<Section, { type: "nav" }>;
type HeroProps = Extract<Section, { type: "hero" }>;
type FeaturesProps = Extract<Section, { type: "features" }>;
type PricingProps = Extract<Section, { type: "pricing" }>;
type TestimonialsProps = Extract<Section, { type: "testimonials" }>;
type FaqProps = Extract<Section, { type: "faq" }>;
type CtaProps = Extract<Section, { type: "cta" }>;
type ContactProps = Extract<Section, { type: "contact" }>;
type FooterProps = Extract<Section, { type: "footer" }>;
type AboutProps = Extract<Section, { type: "about" }>;

export function Nav(props: NavProps) {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <a href="#top" className="kit-display text-xl font-semibold kit-surface px-2">
          {props.brand}
        </a>
        <div className="hidden md:flex items-center gap-6">
          {(props.links || []).map((link) => (
            <a key={link.label} href={link.href} className="text-sm font-medium kit-muted hover:opacity-80">
              {link.label}
            </a>
          ))}
          {props.cta ? (
            <a href={props.cta.href} className="text-white kit-accent focus:ring-4 font-medium rounded-lg text-sm px-5 py-2.5">
              {props.cta.label}
            </a>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

export function Hero(props: HeroProps) {
  const image =
    props.imageUrl ||
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80";
  const centered = props.layout === "centered" || props.layout === "minimal";

  return (
    <section id="top" className="kit-surface">
      <div className={`max-w-screen-xl mx-auto px-4 py-16 lg:py-24 ${centered ? "text-center" : "grid lg:grid-cols-2 gap-12 items-center"}`}>
        <div>
          {props.brand ? <p className="kit-display text-4xl font-bold mb-3">{props.brand}</p> : null}
          <h1 className="kit-display text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">{props.headline}</h1>
          <p className="kit-muted text-lg mb-8 max-w-xl">{props.subheadline}</p>
          <div className={`flex flex-wrap gap-3 ${centered ? "justify-center" : ""}`}>
            <a href={props.primaryCta.href} className="inline-flex items-center justify-center kit-accent text-white font-medium rounded-lg text-base px-6 py-3">
              {props.primaryCta.label}
            </a>
            {props.secondaryCta ? (
              <a href={props.secondaryCta.href} className="inline-flex items-center justify-center font-medium rounded-lg text-base px-6 py-3 border border-gray-300">
                {props.secondaryCta.label}
              </a>
            ) : null}
          </div>
        </div>
        {!centered ? (
          <img className="w-full rounded-lg shadow-xl" src={image} alt="" />
        ) : null}
      </div>
    </section>
  );
}

export function Features(props: FeaturesProps) {
  return (
    <section id="features" className="kit-surface-alt py-16">
      <div className="max-w-screen-xl mx-auto px-4">
        <h2 className="kit-display text-3xl font-bold mb-2">{props.headline}</h2>
        {props.subheadline ? <p className="kit-muted mb-10 max-w-2xl">{props.subheadline}</p> : null}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {props.items.map((item) => (
            <div key={item.title} className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <h3 className="kit-display text-xl font-semibold mb-2">{item.title}</h3>
              <p className="kit-muted text-sm">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function About(props: AboutProps) {
  return (
    <section id="about" className="py-16 px-4 max-w-screen-xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
      <div>
        <h2 className="kit-display text-3xl font-bold mb-4">{props.headline}</h2>
        <p className="kit-muted leading-relaxed">{props.body}</p>
      </div>
      {props.imageUrl ? <img src={props.imageUrl} alt="" className="rounded-lg shadow-lg" /> : null}
    </section>
  );
}

export function Pricing(props: PricingProps) {
  return (
    <section id="pricing" className="kit-surface-alt py-16 px-4">
      <div className="max-w-screen-xl mx-auto">
        <h2 className="kit-display text-3xl font-bold text-center mb-10">{props.headline}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {props.plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col p-6 mx-auto max-w-lg text-center bg-white rounded-lg border shadow ${plan.highlighted ? "border-2" : "border-gray-200"}`}
              style={plan.highlighted ? { borderColor: "var(--accent)" } : undefined}
            >
              <h3 className="kit-display text-xl font-semibold mb-2">{plan.name}</h3>
              <div className="flex justify-center items-baseline my-4">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                {plan.period ? <span className="kit-muted ms-1">{plan.period}</span> : null}
              </div>
              <ul className="mb-6 space-y-2 text-sm kit-muted">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <a href={plan.cta.href} className={`font-medium rounded-lg text-sm px-5 py-2.5 ${plan.highlighted ? "kit-accent text-white" : "border border-gray-300"}`}>
                {plan.cta.label}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials(props: TestimonialsProps) {
  return (
    <section className="py-16 px-4 max-w-screen-xl mx-auto">
      <h2 className="kit-display text-3xl font-bold text-center mb-10">{props.headline}</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {props.items.map((item) => (
          <figure key={item.name} className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <blockquote className="italic kit-muted">&ldquo;{item.quote}&rdquo;</blockquote>
            <figcaption className="mt-4 font-semibold">{item.name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function Faq(props: FaqProps) {
  return (
    <section id="faq" className="py-16 px-4 max-w-3xl mx-auto">
      <h2 className="kit-display text-3xl font-bold mb-8">{props.headline}</h2>
      <div id="accordion-flush" data-accordion="collapse" className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
        {props.items.map((item, i) => (
          <div key={item.question}>
            <h3>
              <button type="button" className="flex items-center justify-between w-full p-5 font-medium text-left">
                {item.question}
              </button>
            </h3>
            <div className={i === 0 ? "" : "hidden"}>
              <div className="p-5 kit-muted text-sm border-t">{item.answer}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Cta(props: CtaProps) {
  return (
    <section id="cta" className="py-20 px-4 text-center kit-surface-alt">
      <div className="max-w-2xl mx-auto">
        <h2 className="kit-display text-3xl font-bold mb-4">{props.headline}</h2>
        {props.body ? <p className="kit-muted mb-8">{props.body}</p> : null}
        <a href={props.cta.href} className="inline-flex kit-accent text-white font-medium rounded-lg text-base px-8 py-3">
          {props.cta.label}
        </a>
      </div>
    </section>
  );
}

export function Contact(props: ContactProps) {
  return (
    <section id="contact" className="py-16 px-4 max-w-lg mx-auto">
      <div className="p-8 bg-white border border-gray-200 rounded-lg shadow">
        <h2 className="kit-display text-2xl font-bold mb-3">{props.headline}</h2>
        {props.body ? <p className="kit-muted mb-4">{props.body}</p> : null}
        {props.email ? <p className="text-sm mb-1">{props.email}</p> : null}
        {props.phone ? <p className="text-sm mb-1">{props.phone}</p> : null}
        {props.cta ? (
          <a href={props.cta.href} className="inline-block mt-4 kit-accent text-white font-medium rounded-lg text-sm px-5 py-2.5">
            {props.cta.label}
          </a>
        ) : null}
      </div>
    </section>
  );
}

export function Footer(props: FooterProps) {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-screen-xl mx-auto p-6 md:flex md:justify-between">
        <div>
          <span className="kit-display text-lg font-semibold">{props.brand}</span>
          {props.tagline ? <p className="kit-muted text-sm mt-1">{props.tagline}</p> : null}
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          {(props.links || []).map((link) => (
            <a key={link.label} href={link.href} className="text-sm kit-muted hover:underline">
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <div className="text-center text-sm kit-muted pb-6">
        {props.copyright || `© ${new Date().getFullYear()} ${props.brand}`}
      </div>
    </footer>
  );
}
