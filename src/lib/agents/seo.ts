/**
 * Deterministic SEO fill — no model call.
 * Uses brand + hero copy already on the page.
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

/** Ensure seo.title / seo.description exist and mention the brand. */
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

  if (
    spec.seo?.title === title &&
    spec.seo?.description === description
  ) {
    return spec;
  }

  return {
    ...spec,
    seo: { title, description },
  };
}
