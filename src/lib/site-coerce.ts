import { parseWebsite, type Website } from "@/lib/schema";

/**
 * Soft-repair common LLM JSON mistakes before Zod validation.
 * Keeps generation resilient without accepting garbage.
 */
export function coerceWebsiteInput(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  const site = { ...(input as Record<string, unknown>) };

  if (!site.theme || typeof site.theme !== "object") {
    site.theme = {};
  }
  const theme = { ...(site.theme as Record<string, unknown>) };
  const defaults: Record<string, string> = {
    primary: "#1a2740",
    accent: "#e8c547",
    surface: "#0a0c10",
    surfaceAlt: "#12161e",
    text: "#eef2f7",
    muted: "#94a3b8",
    displayFont: "Fraunces",
    bodyFont: "DM Sans",
    radius: "medium",
  };
  for (const [k, v] of Object.entries(defaults)) {
    if (theme[k] == null || theme[k] === "") theme[k] = v;
  }
  if (!["none", "small", "medium", "large"].includes(String(theme.radius))) {
    theme.radius = "medium";
  }
  site.theme = theme;

  if (typeof site.brand !== "string" || !site.brand.trim()) {
    site.brand = "Studio";
  }

  if (!Array.isArray(site.pages)) site.pages = [];
  site.pages = (site.pages as unknown[])
    .filter((p) => p && typeof p === "object")
    .map((page, i) => {
      const p = { ...(page as Record<string, unknown>) };
      if (!p.id) p.id = i === 0 ? "home" : `page-${i + 1}`;
      if (!p.name) p.name = i === 0 ? "Home" : `Page ${i + 1}`;
      if (!p.path) p.path = i === 0 ? "/" : `/${String(p.id)}`;
      if (!Array.isArray(p.sections)) p.sections = [];
      p.sections = (p.sections as unknown[])
        .filter((s) => s && typeof s === "object" && (s as { type?: string }).type)
        .map((section) => coerceSection(section as Record<string, unknown>));
      return p;
    })
    .filter((p) => Array.isArray(p.sections) && (p.sections as unknown[]).length > 0);

  return site;
}

function coerceSection(section: Record<string, unknown>): Record<string, unknown> {
  const s = { ...section };
  const type = String(s.type);

  if (type === "nav") {
    if (!s.brand) s.brand = "Brand";
    if (!Array.isArray(s.links)) s.links = [{ label: "Home", href: "/" }];
    s.links = (s.links as unknown[]).map(coerceLink);
    if (s.cta) s.cta = coerceLink(s.cta);
  }

  if (type === "hero") {
    if (!s.headline) s.headline = "Build something remarkable";
    if (!s.subheadline) s.subheadline = "A clear offer for the people you serve.";
    s.primaryCta = coerceLink(s.primaryCta || { label: "Get started", href: "#contact" });
    if (s.secondaryCta) s.secondaryCta = coerceLink(s.secondaryCta);
    if (!["fullscreen", "split", "centered", "minimal"].includes(String(s.layout))) {
      s.layout = "fullscreen";
    }
  }

  if (type === "features" && !Array.isArray(s.items)) {
    s.items = [{ title: "Quality", body: "Crafted with care for your customers." }];
  }
  if (type === "features" && Array.isArray(s.items)) {
    s.items = (s.items as Record<string, unknown>[]).map((item) => ({
      title: String(item.title || "Feature"),
      body: String(item.body || "Details coming soon."),
      icon: item.icon,
    }));
  }

  if (type === "about") {
    if (!s.headline) s.headline = "Our story";
    if (!s.body) s.body = "We help customers get results with care and craft.";
  }

  if (type === "gallery" && !Array.isArray(s.images)) {
    s.images = [
      {
        url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
        alt: "Studio",
      },
    ];
  }

  if (type === "pricing" && Array.isArray(s.plans)) {
    s.plans = (s.plans as Record<string, unknown>[]).map((plan) => ({
      ...plan,
      name: String(plan.name || "Plan"),
      price: String(plan.price || "$0"),
      features: Array.isArray(plan.features) ? plan.features.map(String) : [],
      cta: coerceLink(plan.cta || { label: "Choose", href: "#contact" }),
    }));
  }

  if (type === "testimonials" && Array.isArray(s.items)) {
    s.items = (s.items as Record<string, unknown>[]).map((item) => ({
      quote: String(item.quote || "Amazing experience."),
      name: String(item.name || "Customer"),
      role: item.role ? String(item.role) : undefined,
    }));
  }

  if (type === "faq" && Array.isArray(s.items)) {
    s.items = (s.items as Record<string, unknown>[]).map((item) => ({
      question: String(item.question || "Question?"),
      answer: String(item.answer || "Happy to help."),
    }));
  }

  if (type === "cta") {
    if (!s.headline) s.headline = "Ready to start?";
    s.cta = coerceLink(s.cta || { label: "Contact us", href: "#contact" });
  }

  if (type === "contact" && !s.headline) s.headline = "Contact";

  if (type === "products" && Array.isArray(s.items)) {
    s.items = (s.items as Record<string, unknown>[]).map((item) => ({
      name: String(item.name || "Product"),
      description: String(item.description || "Premium quality."),
      price: item.price != null ? String(item.price) : undefined,
      imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
      href: item.href ? String(item.href) : undefined,
    }));
  }

  if (type === "booking") {
    if (!s.headline) s.headline = "Book a session";
    if (!Array.isArray(s.services)) {
      s.services = [{ name: "Consultation", duration: "30 min", price: "$49" }];
    }
  }

  if (type === "checkout") {
    if (!s.headline) s.headline = "Checkout";
    if (!Array.isArray(s.items)) s.items = [{ name: "Item", price: "$0" }];
    s.cta = coerceLink(s.cta || { label: "Pay now", href: "#checkout" });
  }

  if (type === "footer") {
    if (!s.brand) s.brand = "Brand";
  }

  return s;
}

function coerceLink(input: unknown): { label: string; href: string } {
  if (input && typeof input === "object") {
    const link = input as Record<string, unknown>;
    return {
      label: String(link.label || "Learn more"),
      href: String(link.href || "#"),
    };
  }
  return { label: "Learn more", href: "#" };
}

export function parseWebsiteLenient(input: unknown): Website | null {
  return parseWebsite(coerceWebsiteInput(input));
}
