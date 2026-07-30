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
    <div className="navbar bg-base-100 sticky top-0 z-50 shadow-sm border-b border-base-200 px-4 lg:px-10">
      <div className="flex-1">
        <a href="#top" className="btn btn-ghost text-xl kit-display font-bold">
          {props.brand}
        </a>
      </div>
      <div className="flex-none gap-2 hidden md:flex">
        {(props.links || []).map((link) => (
          <a key={link.label} href={link.href} className="btn btn-ghost btn-sm">
            {link.label}
          </a>
        ))}
        {props.cta ? (
          <a href={props.cta.href} className="btn btn-sm kit-accent">
            {props.cta.label}
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function Hero(props: HeroProps) {
  const image =
    props.imageUrl ||
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80";
  const split = props.layout === "split";

  return (
    <section
      id="top"
      className={`hero ${split ? "min-h-[70vh]" : "min-h-[85vh]"} kit-surface`}
      style={
        split
          ? undefined
          : {
              backgroundImage: `linear-gradient(to right, color-mix(in srgb, var(--surface) 92%, transparent), transparent), url(${image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
      }
    >
      <div className={`hero-content ${split ? "flex-col lg:flex-row gap-10" : ""} max-w-6xl w-full px-4`}>
        <div className={split ? "flex-1 text-left" : "text-center max-w-2xl"}>
          {props.brand ? (
            <p className="kit-display text-4xl lg:text-5xl font-bold mb-3">{props.brand}</p>
          ) : null}
          <h1 className="kit-display text-3xl lg:text-5xl font-bold leading-tight">{props.headline}</h1>
          <p className="py-4 text-lg kit-muted max-w-xl">{props.subheadline}</p>
          <div className={`flex flex-wrap gap-3 ${split ? "" : "justify-center"}`}>
            <a href={props.primaryCta.href} className="btn btn-lg kit-accent">
              {props.primaryCta.label}
            </a>
            {props.secondaryCta ? (
              <a href={props.secondaryCta.href} className="btn btn-lg btn-outline">
                {props.secondaryCta.label}
              </a>
            ) : null}
          </div>
        </div>
        {split ? (
          <img src={image} alt="" className="rounded-2xl shadow-2xl max-w-lg w-full object-cover" />
        ) : null}
      </div>
    </section>
  );
}

export function Features(props: FeaturesProps) {
  return (
    <section id="features" className="py-16 px-4 lg:px-10 kit-surface-alt">
      <div className="max-w-6xl mx-auto">
        <h2 className="kit-display text-3xl font-bold mb-2">{props.headline}</h2>
        {props.subheadline ? <p className="kit-muted mb-8 max-w-2xl">{props.subheadline}</p> : null}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {props.items.map((item) => (
            <div key={item.title} className="card bg-base-100 shadow-md border border-base-200">
              <div className="card-body">
                <h3 className="card-title kit-display">{item.title}</h3>
                <p className="kit-muted text-sm">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function About(props: AboutProps) {
  return (
    <section id="about" className="py-16 px-4 lg:px-10">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="kit-display text-3xl font-bold mb-4">{props.headline}</h2>
          <p className="kit-muted leading-relaxed">{props.body}</p>
        </div>
        {props.imageUrl ? (
          <img src={props.imageUrl} alt="" className="rounded-2xl shadow-lg w-full object-cover" />
        ) : null}
      </div>
    </section>
  );
}

export function Pricing(props: PricingProps) {
  return (
    <section id="pricing" className="py-16 px-4 lg:px-10 kit-surface-alt">
      <div className="max-w-6xl mx-auto">
        <h2 className="kit-display text-3xl font-bold text-center mb-2">{props.headline}</h2>
        {props.subheadline ? (
          <p className="kit-muted text-center mb-10 max-w-xl mx-auto">{props.subheadline}</p>
        ) : null}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {props.plans.map((plan) => (
            <div
              key={plan.name}
              className={`card bg-base-100 shadow-lg ${plan.highlighted ? "ring-2 ring-offset-2" : ""}`}
              style={plan.highlighted ? { borderColor: "var(--accent)" } : undefined}
            >
              <div className="card-body">
                <h3 className="card-title kit-display">{plan.name}</h3>
                <p className="text-3xl font-bold">
                  {plan.price}
                  {plan.period ? <span className="text-sm font-normal kit-muted">{plan.period}</span> : null}
                </p>
                {plan.description ? <p className="kit-muted text-sm">{plan.description}</p> : null}
                <ul className="text-sm kit-muted space-y-1 my-2">
                  {plan.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
                <a href={plan.cta.href} className={`btn w-full ${plan.highlighted ? "kit-accent" : "btn-outline"}`}>
                  {plan.cta.label}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials(props: TestimonialsProps) {
  return (
    <section className="py-16 px-4 lg:px-10">
      <div className="max-w-6xl mx-auto">
        <h2 className="kit-display text-3xl font-bold text-center mb-10">{props.headline}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {props.items.map((item) => (
            <div key={item.name} className="card bg-base-100 shadow border border-base-200">
              <div className="card-body">
                <p className="italic">&ldquo;{item.quote}&rdquo;</p>
                <p className="font-semibold mt-3">{item.name}</p>
                {item.role ? <p className="text-sm kit-muted">{item.role}</p> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq(props: FaqProps) {
  return (
    <section id="faq" className="py-16 px-4 lg:px-10 kit-surface-alt">
      <div className="max-w-3xl mx-auto">
        <h2 className="kit-display text-3xl font-bold mb-8">{props.headline}</h2>
        <div className="space-y-3">
          {props.items.map((item) => (
            <div key={item.question} className="collapse collapse-arrow bg-base-100 border border-base-200">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title font-medium">{item.question}</div>
              <div className="collapse-content kit-muted text-sm">{item.answer}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Cta(props: CtaProps) {
  return (
    <section id="cta" className="py-20 px-4 text-center kit-surface-alt">
      <div className="max-w-2xl mx-auto">
        <h2 className="kit-display text-3xl lg:text-4xl font-bold mb-4">{props.headline}</h2>
        {props.body ? <p className="kit-muted mb-8">{props.body}</p> : null}
        <a href={props.cta.href} className="btn btn-lg kit-accent">
          {props.cta.label}
        </a>
      </div>
    </section>
  );
}

export function Contact(props: ContactProps) {
  return (
    <section id="contact" className="py-16 px-4 lg:px-10">
      <div className="max-w-xl mx-auto card bg-base-100 shadow-xl border border-base-200">
        <div className="card-body">
          <h2 className="card-title kit-display text-2xl">{props.headline}</h2>
          {props.body ? <p className="kit-muted">{props.body}</p> : null}
          {props.email ? <p className="text-sm">Email: {props.email}</p> : null}
          {props.phone ? <p className="text-sm">Phone: {props.phone}</p> : null}
          {props.address ? <p className="text-sm kit-muted">{props.address}</p> : null}
          {props.cta ? (
            <a href={props.cta.href} className="btn kit-accent mt-4">
              {props.cta.label}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function Footer(props: FooterProps) {
  return (
    <footer className="footer footer-center sm:footer-horizontal bg-base-200 text-base-content p-10 border-t">
      <aside>
        <p className="kit-display font-bold text-lg">{props.brand}</p>
        {props.tagline ? <p className="kit-muted text-sm">{props.tagline}</p> : null}
        <p className="text-sm kit-muted">
          {props.copyright || `© ${new Date().getFullYear()} ${props.brand}`}
        </p>
      </aside>
      {(props.links || []).length ? (
        <nav className="grid grid-flow-col gap-4">
          {(props.links || []).map((link) => (
            <a key={link.label} href={link.href} className="link link-hover">
              {link.label}
            </a>
          ))}
        </nav>
      ) : null}
    </footer>
  );
}
