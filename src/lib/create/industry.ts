/**
 * Map wizard industry labels → template-engine industry ids.
 */

const ALIASES: Record<string, string> = {
  coffee: "cafe",
  cafe: "cafe",
  café: "cafe",
  restaurant: "restaurant",
  "real estate": "realestate",
  realestate: "realestate",
  realtor: "realestate",
  fitness: "gym",
  gym: "gym",
  yoga: "gym",
  saas: "saas",
  software: "saas",
  portfolio: "agency",
  agency: "agency",
  blog: "blog",
  store: "boutique",
  shop: "boutique",
  ecommerce: "boutique",
};

export function mapIndustryToTemplate(industry: string): string | undefined {
  const key = industry.trim().toLowerCase();
  if (!key) return undefined;
  if (ALIASES[key]) return ALIASES[key];
  for (const [alias, id] of Object.entries(ALIASES)) {
    if (key.includes(alias)) return id;
  }
  return key.replace(/\s+/g, "");
}

/** Enrich brief for search so "Coffee" beats unrelated food tags like "bar". */
export function enrichBriefForSearch(brief: string, industry?: string): string {
  const mapped = industry ? mapIndustryToTemplate(industry) : undefined;
  if (!mapped) return brief;
  const boost =
    mapped === "cafe"
      ? "cafe coffee espresso latte roastery"
      : mapped;
  if (brief.toLowerCase().includes(boost.split(" ")[0]!)) return brief;
  return `${brief}\nTemplate industry focus: ${boost}`;
}
