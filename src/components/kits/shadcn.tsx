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

const btn =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2";
const btnPrimary = `${btn} bg-primary text-primary-foreground hover:opacity-90`;
const btnOutline = `${btn} border border-border bg-background hover:bg-muted`;
const card = "rounded-lg border border-border bg-card text-card-foreground shadow-sm";

export function Nav(props: NavProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href="#top" className="kit-display text-lg font-semibold tracking-tight">
          {props.brand}
        </a>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {(props.links || []).map((link) => (
            <a key={link.label} href={link.href} className="text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </a>
          ))}
        </nav>
        {props.cta ? (
          <a href={props.cta.href} className={btnPrimary}>{props.cta.label}</a>
        ) : null}
      </div>
    </header>
  );
}

export function Hero(props: HeroProps) {
  const image =
    props.imageUrl ||
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80";
  const minimal = props.layout === "minimal" || props.layout === "centered";

  return (
    <section id="top" className="container mx-auto max-w-6xl px-4 py-20 lg:py-28">
      <div className={`grid gap-12 ${minimal ? "text-center max-w-3xl mx-auto" : "lg:grid-cols-2 lg:items-center"}`}>
        <div className="flex flex-col gap-6">
          {props.brand ? (
            <p className="kit-display text-4xl font-bold tracking-tight">{props.brand}</p>
          ) : null}
          <h1 className="kit-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {props.headline}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">{props.subheadline}</p>
          <div className={`flex flex-wrap gap-3 ${minimal ? "justify-center" : ""}`}>
            <a href={props.primaryCta.href} className={btnPrimary + " h-11 px-8"}>
              {props.primaryCta.label}
            </a>
            {props.secondaryCta ? (
              <a href={props.secondaryCta.href} className={btnOutline + " h-11 px-8"}>
                {props.secondaryCta.label}
              </a>
            ) : null}
          </div>
        </div>
        {!minimal ? (
          <div className={`${card} overflow-hidden`}>
            <img src={image} alt="" className="aspect-[4/3] w-full object-cover" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function Features(props: FeaturesProps) {
  return (
    <section id="features" className="border-t border-border bg-muted/30 py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="max-w-2xl mb-12">
          <h2 className="kit-display text-3xl font-bold tracking-tight">{props.headline}</h2>
          {props.subheadline ? (
            <p className="mt-3 text-muted-foreground">{props.subheadline}</p>
          ) : null}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {props.items.map((item) => (
            <div key={item.title} className={`${card} p-6`}>
              <h3 className="kit-display font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function About(props: AboutProps) {
  return (
    <section id="about" className="container mx-auto max-w-6xl px-4 py-20 grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <h2 className="kit-display text-3xl font-bold mb-4">{props.headline}</h2>
        <p className="text-muted-foreground leading-relaxed">{props.body}</p>
      </div>
      {props.imageUrl ? (
        <div className={`${card} overflow-hidden`}>
          <img src={props.imageUrl} alt="" className="w-full object-cover" />
        </div>
      ) : null}
    </section>
  );
}

export function Pricing(props: PricingProps) {
  return (
    <section id="pricing" className="border-t border-border py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <h2 className="kit-display text-3xl font-bold text-center mb-12">{props.headline}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {props.plans.map((plan) => (
            <div
              key={plan.name}
              className={`${card} flex flex-col p-8 ${plan.highlighted ? "ring-2 ring-primary" : ""}`}
            >
              <h3 className="kit-display font-semibold text-lg">{plan.name}</h3>
              <p className="mt-4 text-4xl font-bold tracking-tight">
                {plan.price}
                {plan.period ? <span className="text-sm font-normal text-muted-foreground">{plan.period}</span> : null}
              </p>
              <ul className="mt-6 flex-1 space-y-2 text-sm text-muted-foreground">
                {plan.features.map((f) => <li key={f}>• {f}</li>)}
              </ul>
              <a href={plan.cta.href} className={`mt-8 w-full text-center ${plan.highlighted ? btnPrimary : btnOutline}`}>
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
    <section className="py-20 border-t border-border">
      <div className="container mx-auto max-w-6xl px-4">
        <h2 className="kit-display text-3xl font-bold text-center mb-12">{props.headline}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {props.items.map((item) => (
            <div key={item.name} className={`${card} p-6`}>
              <p className="text-muted-foreground italic">&ldquo;{item.quote}&rdquo;</p>
              <p className="mt-4 font-medium">{item.name}</p>
              {item.role ? <p className="text-sm text-muted-foreground">{item.role}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq(props: FaqProps) {
  return (
    <section id="faq" className="py-20 bg-muted/30">
      <div className="container mx-auto max-w-3xl px-4">
        <h2 className="kit-display text-3xl font-bold mb-8">{props.headline}</h2>
        <div className="space-y-4">
          {props.items.map((item) => (
            <div key={item.question} className={`${card} p-5`}>
              <h3 className="font-medium mb-2">{item.question}</h3>
              <p className="text-sm text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Cta(props: CtaProps) {
  return (
    <section id="cta" className="border-t border-border py-20">
      <div className="container mx-auto max-w-2xl px-4 text-center">
        <h2 className="kit-display text-3xl font-bold tracking-tight mb-4">{props.headline}</h2>
        {props.body ? <p className="text-muted-foreground mb-8">{props.body}</p> : null}
        <a href={props.cta.href} className={btnPrimary + " h-11 px-8"}>{props.cta.label}</a>
      </div>
    </section>
  );
}

export function Contact(props: ContactProps) {
  return (
    <section id="contact" className="py-20">
      <div className={`container mx-auto max-w-md px-4 ${card} p-8`}>
        <h2 className="kit-display text-2xl font-bold mb-3">{props.headline}</h2>
        {props.body ? <p className="text-muted-foreground mb-4">{props.body}</p> : null}
        {props.email ? <p className="text-sm">{props.email}</p> : null}
        {props.cta ? (
          <a href={props.cta.href} className={btnPrimary + " mt-6 w-full"}>{props.cta.label}</a>
        ) : null}
      </div>
    </section>
  );
}

export function Footer(props: FooterProps) {
  return (
    <footer className="border-t border-border py-10">
      <div className="container mx-auto max-w-6xl px-4 flex flex-col md:flex-row justify-between gap-6">
        <div>
          <p className="kit-display font-semibold">{props.brand}</p>
          {props.tagline ? <p className="text-sm text-muted-foreground mt-1">{props.tagline}</p> : null}
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          {(props.links || []).map((link) => (
            <a key={link.label} href={link.href} className="hover:text-foreground">{link.label}</a>
          ))}
        </div>
      </div>
      <p className="container mx-auto max-w-6xl px-4 text-sm text-muted-foreground mt-6">
        {props.copyright || `© ${new Date().getFullYear()} ${props.brand}`}
      </p>
    </footer>
  );
}
