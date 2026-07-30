import { parseBrief } from "@/lib/brief-parser";
import { pickThemeFromBrief } from "@/lib/themes";
import type { Plan, SectionId, SiteSpec } from "./schema";
import { DEFAULT_SECTIONS } from "./schema";

function brandFromBrief(prompt: string): string {
  const brief = parseBrief(prompt);
  if (brief.brandHint) return brief.brandHint;
  if (brief.exactPhrases[0]) return brief.exactPhrases[0];
  const words = prompt.split(/\s+/).filter(Boolean);
  return words.slice(0, 2).join(" ") || "My Business";
}

export function buildDemoPlan(prompt: string, theme?: string | null): Plan {
  const brief = parseBrief(prompt);
  return {
    theme: (theme as Plan["theme"]) || pickThemeFromBrief(prompt),
    brand: brandFromBrief(prompt),
    pages: [
      {
        slug: "home",
        title: "Home",
        intent: `Homepage for ${brandFromBrief(prompt)}${brief.location ? ` in ${brief.location}` : ""}: ${prompt.slice(0, 120)}`,
      },
    ],
  };
}

function demoContentForSection(
  id: SectionId,
  brand: string,
  prompt: string,
): Record<string, unknown> {
  const brief = parseBrief(prompt);
  const city = brief.location || "your area";

  switch (id) {
    case "hero_centered":
    case "hero_split":
      return {
        headline: `${brand} — built for ${city}`,
        subhead: prompt.slice(0, 120),
        ctaLabel: "Get started",
        image: { query: prompt.split(" ").slice(0, 3).join(" ") },
      };
    case "logos_strip":
      return {
        headline: "Trusted locally",
        logos: ["Client A", "Client B", "Client C", "Client D"],
      };
    case "features_3col":
      return {
        headline: `Why ${brand}`,
        items: [
          { title: "Quality first", body: `What sets ${brand} apart in ${city}.` },
          { title: "Personal service", body: "Direct attention on every order and visit." },
          { title: "Easy to reach", body: "Book, order, or message us in minutes." },
        ],
      };
    case "feature_image_left":
    case "feature_image_right":
      return {
        headline: `The ${brand} difference`,
        body: prompt.slice(0, 200),
        image: { query: brand },
      };
    case "testimonial_single":
      return {
        quote: `${brand} delivered exactly what we needed — professional and personal.`,
        name: "Alex M.",
        role: "Local customer",
        image: { query: "portrait professional" },
      };
    case "pricing_3tier":
      return {
        headline: "Plans",
        plans: [
          { name: "Starter", price: "$29", period: "/mo", features: ["Core access"], highlighted: false },
          { name: "Growth", price: "$59", period: "/mo", features: ["Everything in Starter", "Priority support"], highlighted: true },
          { name: "Pro", price: "$99", period: "/mo", features: ["Full access", "Dedicated help"], highlighted: false },
        ],
      };
    case "faq_accordion":
      return {
        headline: "Questions",
        items: [
          { question: `What does ${brand} offer?`, answer: prompt.slice(0, 150) },
          { question: "How do I get started?", answer: "Contact us or use the form below." },
          { question: "Where are you located?", answer: `We serve ${city} and nearby areas.` },
          { question: "What are your hours?", answer: "Reach out for current availability." },
        ],
      };
    case "about_text":
      return {
        headline: `About ${brand}`,
        body: `${brand} serves ${city} with a focus on quality and care.\n\n${prompt.slice(0, 180)}`,
        stats: [
          { label: "Years serving", value: "5+" },
          { label: "Happy clients", value: "500+" },
        ],
      };
    case "contact_form":
      return {
        headline: "Contact us",
        subhead: `Questions about ${brand}? Send a message.`,
        submitLabel: "Send message",
      };
    case "cta_band":
      return {
        headline: `Ready to work with ${brand}?`,
        ctaLabel: "Contact us",
      };
    case "footer_simple":
      return { tagline: `${brand} — ${city}` };
    default:
      return {};
  }
}

export function buildDemoSpec(prompt: string, theme?: string | null): SiteSpec {
  const plan = buildDemoPlan(prompt, theme);
  const sections = DEFAULT_SECTIONS;

  return {
    theme: plan.theme,
    brand: plan.brand,
    seo: {
      title: `${plan.brand} — Home`,
      description: prompt.slice(0, 155),
    },
    pages: plan.pages.map((page) => ({
      slug: page.slug,
      title: page.title,
      sections: sections.map((id) => ({
        id,
        content: demoContentForSection(id, plan.brand, prompt),
      })),
    })),
  };
}
