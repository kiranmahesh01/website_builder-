import type { SiteThemeName } from "@/lib/themes";
import type { SiteSpec } from "./schema";
import { searchStockImage, type StockImageProvider } from "./image-providers";

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
  bakery: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1600&q=80",
  sourdough: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=1600&q=80",
  pastry: "https://images.unsplash.com/photo-1486427948965-c30a64fb0d8a?w=1600&q=80",
  dental: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1600&q=80",
  dentist: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=1600&q=80",
  clinic: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&q=80",
  yoga: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1600&q=80",
  gym: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=80",
  law: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&q=80",
  shop: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
  hotel: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80",
  portfolio: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1600&q=80",
  designer: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1600&q=80",
  saas: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1600&q=80",
  portrait: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80",
  brooklyn: "https://images.unsplash.com/photo-1555507036-ab794f4eece0?w=1600&q=80",
  austin: "https://images.unsplash.com/photo-1531218150217-097990db5a4f?w=1600&q=80",
};

const queryCache = new Map<string, string>();

function staticImageForQuery(query: string, theme: SiteThemeName): string {
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

export function resolveImageQuerySync(
  query: string,
  theme: SiteThemeName,
): string {
  return staticImageForQuery(query, theme);
}

export async function resolveImageQuery(
  query: string,
  theme: SiteThemeName,
): Promise<string> {
  const cached = queryCache.get(query);
  if (cached) return cached;

  const result = await searchStockImage(query);
  if (result) {
    queryCache.set(query, result.url);
    return result.url;
  }

  return staticImageForQuery(query, theme);
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

function isImageSlot(value: unknown): value is { query: string } {
  return Boolean(
    value &&
      typeof value === "object" &&
      "query" in value &&
      typeof (value as { query?: unknown }).query === "string",
  );
}

function walkContentImages(
  content: Record<string, unknown>,
  visitor: (query: string) => void,
): void {
  for (const value of Object.values(content)) {
    if (isImageSlot(value)) {
      visitor(value.query);
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === "object") {
          walkContentImages(item as Record<string, unknown>, visitor);
        }
      }
    }
  }
}

function replaceContentImages(
  content: Record<string, unknown>,
  resolver: (query: string) => string | undefined,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...content };

  for (const [key, value] of Object.entries(content)) {
    if (isImageSlot(value)) {
      const url = resolver(value.query);
      if (url) next[key] = url;
      continue;
    }
    if (Array.isArray(value)) {
      next[key] = value.map((item) => {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          return replaceContentImages(item as Record<string, unknown>, resolver);
        }
        return item;
      });
    }
  }

  return next;
}

export async function enrichSpecWithImages(spec: SiteSpec): Promise<SiteSpec> {
  const theme = spec.theme;
  const queries = new Set<string>();

  for (const page of spec.pages) {
    for (const section of page.sections) {
      walkContentImages(section.content, (query) => queries.add(query));
    }
  }

  const resolved = new Map<string, string>();
  await Promise.all(
    [...queries].map(async (query) => {
      const url = await resolveImageQuery(query, theme);
      resolved.set(query, url);
    }),
  );

  return {
    ...spec,
    pages: spec.pages.map((page) => ({
      ...page,
      sections: page.sections.map((section) => ({
        ...section,
        content: replaceContentImages(section.content, (query) => resolved.get(query)),
      })),
    })),
  };
}

export type ImageProviderInfo = {
  id: StockImageProvider;
  name: string;
  freeLimit: string;
  attribution: string;
  notes: string;
  envKey?: string;
  recommended?: boolean;
};

export const IMAGE_PROVIDER_GUIDE: ImageProviderInfo[] = [
  {
    id: "pexels",
    name: "Pexels",
    freeLimit: "200 requests/hour",
    attribution: "Not required",
    notes: "Best default for business sites — commercial use, includes video.",
    envKey: "PEXELS_API_KEY",
    recommended: true,
  },
  {
    id: "pixabay",
    name: "Pixabay",
    freeLimit: "Unlimited (per docs)",
    attribution: "Not required",
    notes: "Great fallback — huge library, vectors and illustrations.",
    envKey: "PIXABAY_API_KEY",
    recommended: true,
  },
  {
    id: "unsplash",
    name: "Unsplash",
    freeLimit: "50 requests/hour",
    attribution: "Required",
    notes: "Highest quality but tightest limits.",
    envKey: "UNSPLASH_ACCESS_KEY",
  },
  {
    id: "openverse",
    name: "Openverse",
    freeLimit: "No key needed",
    attribution: "Varies by image",
    notes: "Meta-search across CC sources — works without any API key.",
  },
  {
    id: "wikimedia",
    name: "Wikimedia Commons",
    freeLimit: "No key needed",
    attribution: "Varies by image",
    notes: "Good for landmarks, cities, and place-specific shots.",
  },
];
