import type { Section, Website } from "@/lib/schema";
import { normalizeUiKit } from "@/lib/ui-kits";
import {
  getThemeTokens,
  normalizeSiteTheme,
  themeToUiKit,
  type SiteThemeName,
} from "@/lib/themes";
import { imageFromSlot } from "./images";
import type { SectionId, SiteSpec } from "./schema";
import { truncateToWords } from "./validate";

function str(val: unknown, fallback = ""): string {
  return typeof val === "string" ? val : fallback;
}

function cta(label: unknown, href = "#contact"): { label: string; href: string } {
  return { label: str(label, "Get started"), href };
}

function specSectionToWebsite(
  id: SectionId,
  content: Record<string, unknown>,
  brand: string,
  theme: SiteThemeName,
): Section | Section[] | null {
  switch (id) {
    case "hero_centered":
      return {
        type: "hero",
        layout: "centered",
        brand,
        headline: str(content.headline, brand),
        subheadline: str(content.subhead, `Discover what ${brand} offers.`),
        primaryCta: cta(content.ctaLabel),
      };
    case "hero_split":
      return {
        type: "hero",
        layout: "split",
        brand,
        headline: str(content.headline, brand),
        subheadline: str(content.subhead, `Discover what ${brand} offers.`),
        primaryCta: cta(content.ctaLabel),
        imageUrl: imageFromSlot(content.image, theme),
      };
    case "logos_strip": {
      const logos = Array.isArray(content.logos) ? content.logos : [];
      return {
        type: "features",
        headline: str(content.headline, "Trusted by"),
        variant: "rows",
        items: logos.map((logo) => ({
          title: str(logo),
          body: "",
        })),
      };
    }
    case "features_3col": {
      const items = Array.isArray(content.items) ? content.items : [];
      return {
        type: "features",
        headline: str(content.headline, "What we offer"),
        variant: "grid",
        items: items.slice(0, 3).map((item) => {
          const o = item as Record<string, unknown>;
          return {
            title: str(o.title, "Feature"),
            body: str(o.body, ""),
          };
        }),
      };
    }
    case "feature_image_left":
      return {
        type: "about",
        headline: str(content.headline, "Why choose us"),
        body: str(content.body, ""),
        imageUrl: imageFromSlot(content.image, theme),
      };
    case "feature_image_right":
      return {
        type: "about",
        headline: str(content.headline, "Why choose us"),
        body: str(content.body, ""),
        imageUrl: imageFromSlot(content.image, theme),
      };
    case "testimonial_single":
      return {
        type: "testimonials",
        headline: "What clients say",
        items: [
          {
            quote: str(content.quote, "Great experience."),
            name: str(content.name, "Happy customer"),
            role: str(content.role, "Client"),
          },
        ],
      };
    case "pricing_3tier": {
      const plans = Array.isArray(content.plans) ? content.plans : [];
      return {
        type: "pricing",
        headline: str(content.headline, "Pricing"),
        plans: plans.slice(0, 3).map((plan, i) => {
          const p = plan as Record<string, unknown>;
          const features = Array.isArray(p.features)
            ? p.features.map((f) => str(f))
            : [];
          return {
            name: str(p.name, `Plan ${i + 1}`),
            price: str(p.price, "$0"),
            period: str(p.period, "/mo"),
            features,
            cta: cta(p.ctaLabel || "Choose plan"),
            highlighted: Boolean(p.highlighted) || i === 1,
          };
        }),
      };
    }
    case "faq_accordion": {
      const items = Array.isArray(content.items) ? content.items : [];
      return {
        type: "faq",
        headline: str(content.headline, "FAQ"),
        items: items.map((item) => {
          const o = item as Record<string, unknown>;
          return {
            question: str(o.question, "Question"),
            answer: str(o.answer, "Answer"),
          };
        }),
      };
    }
    case "about_text": {
      const stats = Array.isArray(content.stats)
        ? content.stats.map((s) => {
            const o = s as Record<string, unknown>;
            return { label: str(o.label), value: str(o.value) };
          })
        : undefined;
      const body = str(content.body);
      const paragraphs = body.split(/\n\n+/).filter(Boolean);
      return {
        type: "about",
        headline: str(content.headline, `About ${brand}`),
        body: paragraphs.join("\n\n") || `Learn more about ${brand}.`,
        stats,
      };
    }
    case "contact_form":
      return {
        type: "contact",
        headline: str(content.headline, "Get in touch"),
        body: str(content.subhead, `Reach out to ${brand}.`),
        cta: cta(content.submitLabel, "#"),
      };
    case "cta_band":
      return {
        type: "cta",
        headline: str(content.headline, `Work with ${brand}`),
        cta: cta(content.ctaLabel),
      };
    case "footer_simple":
      return {
        type: "footer",
        brand,
        tagline: truncateToWords(str(content.tagline, ""), 12) || undefined,
        copyright: `© ${new Date().getFullYear()} ${brand}`,
      };
    default:
      return null;
  }
}

function buildNav(brand: string): Section {
  return {
    type: "nav",
    brand,
    links: [
      { label: "About", href: "#about" },
      { label: "Services", href: "#features" },
      { label: "Contact", href: "#contact" },
    ],
    cta: { label: "Contact", href: "#contact" },
  };
}

export function specToWebsite(
  spec: SiteSpec,
  options?: { theme?: string | null; uiKit?: string | null },
): Website {
  const themeName = normalizeSiteTheme(options?.theme || spec.theme);
  const tokens = getThemeTokens(themeName);
  const kit = options?.uiKit
    ? normalizeUiKit(options.uiKit)
    : themeToUiKit(themeName);

  const pages = spec.pages.map((page, pageIndex) => {
    const sections: Section[] = [buildNav(spec.brand)];

    for (const block of page.sections) {
      const mapped = specSectionToWebsite(
        block.id,
        block.content,
        spec.brand,
        themeName,
      );
      if (!mapped) continue;
      if (Array.isArray(mapped)) sections.push(...mapped);
      else sections.push(mapped);
    }

    return {
      id: page.slug,
      name: page.title,
      path: pageIndex === 0 ? "/" : `/${page.slug}`,
      sections,
    };
  });

  return {
    brand: spec.brand,
    theme: tokens,
    uiKit: kit,
    seo: spec.seo,
    pages,
  };
}
