import type { Website } from "@/lib/schema";

/** Higher = richer / more complete structured site. */
export function scoreWebsite(site: Website): number {
  let score = 0;
  score += site.pages.length * 120;

  const types = new Set<string>();
  let sections = 0;
  let copyChars = 0;

  for (const page of site.pages) {
    sections += page.sections.length;
    score += page.sections.length * 25;
    for (const section of page.sections) {
      types.add(section.type);
      copyChars += JSON.stringify(section).length;
    }
  }

  score += types.size * 40;
  if (types.has("nav")) score += 30;
  if (types.has("hero")) score += 50;
  if (types.has("footer")) score += 30;
  if (types.has("features") || types.has("products")) score += 25;
  if (types.has("pricing") || types.has("cta")) score += 20;
  if (site.pages.length >= 2) score += 80;
  if (site.pages.length >= 3) score += 40;

  // Prefer substantial copy without rewarding spam endlessly
  score += Math.min(220, Math.floor(copyChars / 40));

  if (site.brand?.trim()) score += 15;
  if (site.theme?.displayFont && site.theme?.bodyFont) score += 10;

  return score;
}

export function pickBestWebsite(
  candidates: { site: Website; raw: string; model: string }[],
): { site: Website; raw: string; model: string; score: number } | null {
  if (!candidates.length) return null;
  let best = {
    ...candidates[0],
    score: scoreWebsite(candidates[0].site),
  };
  for (let i = 1; i < candidates.length; i++) {
    const score = scoreWebsite(candidates[i].site);
    if (score > best.score) {
      best = { ...candidates[i], score };
    }
  }
  return best;
}
