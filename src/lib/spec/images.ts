import type { SiteThemeName } from "@/lib/themes";

const FALLBACK_IMAGES: Record<SiteThemeName, string[]> = {
  bold_startup: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80",
  ],
  warm_editorial: [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
  ],
  minimal_studio: [
    "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1600&q=80",
    "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1600&q=80",
  ],
};

const NICHE_IMAGES: Record<string, string> = {
  coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80",
  restaurant: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80",
  yoga: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1600&q=80",
  gym: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=80",
  law: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&q=80",
  shop: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
  hotel: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80",
  portfolio: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1600&q=80",
  saas: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1600&q=80",
  bakery: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1600&q=80",
  portrait: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80",
};

const queryCache = new Map<string, string>();

export function resolveImageQuerySync(
  query: string,
  theme: SiteThemeName,
): string {
  const cached = queryCache.get(query);
  if (cached) return cached;

  const q = query.toLowerCase();
  for (const [key, url] of Object.entries(NICHE_IMAGES)) {
    if (q.includes(key)) {
      queryCache.set(query, url);
      return url;
    }
  }
  const fallbacks = FALLBACK_IMAGES[theme];
  const hash = query.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const url = fallbacks[hash % fallbacks.length];
  queryCache.set(query, url);
  return url;
}

export async function resolveImageQuery(
  query: string,
  theme: SiteThemeName,
): Promise<string> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return resolveImageQuerySync(query, theme);

  const cached = queryCache.get(query);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` }, next: { revalidate: 86400 } },
    );
    if (res.ok) {
      const data = (await res.json()) as {
        results?: { urls?: { regular?: string } }[];
      };
      const url = data.results?.[0]?.urls?.regular;
      if (url) {
        queryCache.set(query, url);
        return url;
      }
    }
  } catch {
    // fall through to static
  }
  return resolveImageQuerySync(query, theme);
}

export function imageFromSlot(
  slot: unknown,
  theme: SiteThemeName,
): string | undefined {
  if (typeof slot === "string" && slot.startsWith("http")) return slot;
  if (slot && typeof slot === "object" && "query" in slot) {
    const query = (slot as { query?: string }).query;
    if (query) return resolveImageQuerySync(query, theme);
  }
  return undefined;
}
