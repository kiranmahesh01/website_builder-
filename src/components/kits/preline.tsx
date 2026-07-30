import type { Section } from "@/lib/schema";

type NavProps = Extract<Section, { type: "nav" }>;
type HeroProps = Extract<Section, { type: "hero" }>;
type FeaturesProps = Extract<Section, { type: "features" }>;
type PricingProps = Extract<Section, { type: "pricing" }>;
type TestimonialsProps = Extract<Section, { type: "testimonials" }>;
type CtaProps = Extract<Section, { type: "cta" }>;
type ContactProps = Extract<Section, { type: "contact" }>;
type FooterProps = Extract<Section, { type: "footer" }>;
type AboutProps = Extract<Section, { type: "about" }>;

export function Nav(props: NavProps) {
  return (
    <header className="flex flex-wrap md:justify-start md:flex-nowrap z-50 w-full kit-surface border-b border-gray-200">
      <nav className="max-w-[85rem] w-full mx-auto md:flex md:items-center md:justify-between py-3 px-4 md:px-6 lg:px-8">
        <a href="#top" className="kit-display text-xl font-semibold">{props.brand}</a>
        <div className="hidden md:flex items-center gap-x-6">
          {(props.links || []).map((link) => (
            <a key={link.label} href={link.href} className="text-sm kit-muted hover:text-gray-800">
              {link.label}
            </a>
          ))}
          {props.cta ? (
            <a href={props.cta.href} className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg kit-accent text-white">
              {props.cta.label}
            </a>
          ) : null}
        </div>
      </nav>
    </header>
  );
}

export function Hero(props: HeroProps) {
  const image =
    props.imageUrl ||
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80";

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="max-w-[85rem] mx-auto px-4 py-20 sm:py-28 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
        <div>
          {props.brand ? <p className="kit-display text-4xl sm:text-5xl font-bold mb-4">{props.brand}</p> : null}
          <h1 className="block text-3xl font-bold kit-display sm:text-4xl lg:text-5xl lg:leading-tight">
            {props.headline}
          </h1>
          <p className="mt-4 text-lg kit-muted">{props.subheadline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={props.primaryCta.href} className="py-3 px-5 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg kit-accent text-white">
              {props.primaryCta.label}
            </a>
            {props.secondaryCta ? (
              <a href={props.secondaryCta.href} className="py-3 px-5 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200">
                {props.secondaryCta.label}
              </a>
            ) : null}
          </div>
        </div>
        <img className="w-full rounded-xl shadow-2xl mt-10 lg:mt-0" src={image} alt="" />
      </div>
    </section>
  );
}

export function Features(props: FeaturesProps) {
  return (
    <section id="features" className="kit-surface-alt py-16 lg:py-24">
      <div className="max-w-[85rem] px-4 sm:px-6 lg:px-8 mx-auto">
        <h2 className="kit-display text-3xl font-bold mb-3">{props.headline}</h2>
        {props.subheadline ? <p className="kit-muted mb-12 max-w-2xl">{props.subheadline}</p> : null}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {props.items.map((item) => (
            <div key={item.title} className="group flex flex-col h-full bg-white border border-gray-200 shadow-sm rounded-xl p-6">
              <h3 className="kit-display text-lg font-semibold mb-2">{item.title}</h3>
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
    <section id="about" className="max-w-[85rem] mx-auto px-4 py-16 grid lg:grid-cols-2 gap-10 items-center">
      <div>
        <h2 className="kit-display text-3xl font-bold mb-4">{props.headline}</h2>
        <p className="kit-muted leading-relaxed">{props.body}</p>
      </div>
      {props.imageUrl ? <img src={props.imageUrl} alt="" className="rounded-xl shadow-lg" /> : null}
    </section>
  );
}

export function Pricing(props: PricingProps) {
  return (
    <section id="pricing" className="py-16 lg:py-24 kit-surface-alt">
      <div className="max-w-[85rem] px-4 mx-auto">
        <h2 className="kit-display text-3xl font-bold text-center mb-12">{props.headline}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {props.plans.map((plan) => (
            <div key={plan.name} className={`flex flex-col p-8 bg-white border rounded-2xl shadow-sm ${plan.highlighted ? "border-2" : "border-gray-200"}`} style={plan.highlighted ? { borderColor: "var(--accent)" } : undefined}>
              <h3 className="kit-display text-xl font-semibold">{plan.name}</h3>
              <p className="mt-4 text-4xl font-bold">{plan.price}</p>
              <ul className="mt-6 space-y-2 text-sm kit-muted flex-1">
                {plan.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <a href={plan.cta.href} className={`mt-8 py-3 px-4 inline-flex justify-center rounded-lg text-sm font-medium ${plan.highlighted ? "kit-accent text-white" : "border border-gray-200"}`}>
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
    <section className="py-16 max-w-[85rem] mx-auto px-4">
      <h2 className="kit-display text-3xl font-bold text-center mb-12">{props.headline}</h2>
      <div className="grid md:grid-cols-2 gap-8">
        {props.items.map((item) => (
          <blockquote key={item.name} className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
            <p className="kit-muted italic">&ldquo;{item.quote}&rdquo;</p>
            <footer className="mt-4 font-semibold">{item.name}</footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

export function Cta(props: CtaProps) {
  return (
    <section id="cta" className="py-20 text-center kit-surface-alt">
      <div className="max-w-2xl mx-auto px-4">
        <h2 className="kit-display text-3xl lg:text-4xl font-bold mb-4">{props.headline}</h2>
        {props.body ? <p className="kit-muted mb-8">{props.body}</p> : null}
        <a href={props.cta.href} className="py-3 px-6 inline-flex rounded-lg kit-accent text-white font-medium">
          {props.cta.label}
        </a>
      </div>
    </section>
  );
}

export function Contact(props: ContactProps) {
  return (
    <section id="contact" className="py-16 px-4 max-w-lg mx-auto">
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8">
        <h2 className="kit-display text-2xl font-bold mb-3">{props.headline}</h2>
        {props.body ? <p className="kit-muted mb-4">{props.body}</p> : null}
        {props.email ? <p className="text-sm">{props.email}</p> : null}
        {props.cta ? (
          <a href={props.cta.href} className="mt-6 inline-flex py-2.5 px-4 kit-accent text-white rounded-lg text-sm font-medium">
            {props.cta.label}
          </a>
        ) : null}
      </div>
    </section>
  );
}

export function Footer(props: FooterProps) {
  return (
    <footer className="border-t border-gray-200 kit-surface-alt">
      <div className="max-w-[85rem] mx-auto px-4 py-10 flex flex-col md:flex-row justify-between gap-6">
        <div>
          <p className="kit-display font-semibold text-lg">{props.brand}</p>
          {props.tagline ? <p className="kit-muted text-sm mt-1">{props.tagline}</p> : null}
        </div>
        <div className="flex gap-4">
          {(props.links || []).map((link) => (
            <a key={link.label} href={link.href} className="text-sm kit-muted hover:underline">{link.label}</a>
          ))}
        </div>
      </div>
      <p className="text-center text-sm kit-muted pb-8">{props.copyright || `© ${new Date().getFullYear()} ${props.brand}`}</p>
    </footer>
  );
}
