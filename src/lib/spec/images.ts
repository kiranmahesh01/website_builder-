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
};

export function resolveImageQuery(
  query: string,
  theme: SiteThemeName,
): string {
  const q = query.toLowerCase();
  for (const [key, url] of Object.entries(NICHE_IMAGES)) {
    if (q.includes(key)) return url;
  }
  const fallbacks = FALLBACK_IMAGES[theme];
  const hash = query.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return fallbacks[hash % fallbacks.length];
}

export function imageFromSlot(
  slot: unknown,
  theme: SiteThemeName,
): string | undefined {
  if (typeof slot === "string" && slot.startsWith("http")) return slot;
  if (slot && typeof slot === "object" && "query" in slot) {
    const query = (slot as { query?: string }).query;
    if (query) return resolveImageQuery(query, theme);
  }
  return undefined;
}
