/**
 * Deterministic SEO fill — title, description, keywords, JSON-LD hint.
 * No model call (protects generate budget).
 */

import { sectionKey, type SiteSpec } from "@/lib/spec/schema";

function firstHeroCopy(spec: SiteSpec): { headline?: string; subhead?: string } {
  for (const page of spec.pages) {
    for (const [index, section] of page.sections.entries()) {
      if (!section.id.startsWith("hero_")) continue;
      void (section.key || sectionKey(page.slug, section.id, index));
      const headline =
        typeof section.content.headline === "string"
          ? section.content.headline
          : undefined;
      const subhead =
        typeof section.content.subhead === "string"
          ? section.content.subhead
          : undefined;
      return { headline, subhead };
    }
  }
  return {};
}

function keywordList(spec: SiteSpec, headline?: string): string[] {
  const existing = spec.seo?.keywords?.filter(Boolean) || [];
  if (existing.length >= 3) return existing.slice(0, 8);

  const words = [
    spec.brand,
    headline,
    ...spec.pages.map((p) => p.title),
    ...spec.pages.flatMap((p) => p.sections.map((s) => s.id.replace(/_/g, " "))),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const unique = [...new Set([spec.brand.toLowerCase(), ...words])].slice(0, 8);
  return unique;
}

/** LocalBusiness / WebSite JSON-LD for the published HTML head. */
export function buildJsonLd(spec: SiteSpec): Record<string, unknown> {
  const { headline, subhead } = firstHeroCopy(spec);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: spec.brand,
    description:
      spec.seo?.description ||
      subhead ||
      `${spec.brand}${headline ? ` — ${headline}` : ""}`,
    publisher: {
      "@type": "Organization",
      name: spec.brand,
    },
  };
}

/** Sitemap hint for multi-page specs (shown in SEO panel; not a live XML file). */
export function sitemapHint(spec: SiteSpec): string[] {
  return spec.pages.map((p) => `/${p.slug === "home" ? "" : p.slug}`.replace(/\/$/, "/") || "/");
}

/** Ensure seo.title / seo.description / keywords exist and mention the brand. */
export function ensureSeo(spec: SiteSpec): SiteSpec {
  const { headline, subhead } = firstHeroCopy(spec);
  const title =
    spec.seo?.title?.trim() ||
    (headline ? `${spec.brand} — ${headline}` : `${spec.brand}`).slice(0, 70);
  const description = (
    spec.seo?.description?.trim() ||
    subhead ||
    `${spec.brand} — ${headline || "built with Magic AI"}`
  ).slice(0, 160);
  const keywords = keywordList(spec, headline);

  if (
    spec.seo?.title === title &&
    spec.seo?.description === description &&
    JSON.stringify(spec.seo?.keywords || []) === JSON.stringify(keywords)
  ) {
    return spec;
  }

  return {
    ...spec,
    seo: { title, description, keywords, ogImage: spec.seo?.ogImage },
  };
}
