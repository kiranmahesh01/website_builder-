export type StockImageProvider =
  | "pexels"
  | "pixabay"
  | "unsplash"
  | "openverse"
  | "wikimedia"
  | "static";

export type StockImageResult = {
  url: string;
  provider: StockImageProvider;
  attribution?: string;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, { ...init, next: { revalidate: 86400 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function searchPexels(query: string): Promise<StockImageResult | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;

  const data = await fetchJson<{
    photos?: { src?: { large2x?: string; landscape?: string }; photographer?: string }[];
  }>(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
    { headers: { Authorization: key } },
  );

  const photo = data?.photos?.[0];
  const url = photo?.src?.large2x || photo?.src?.landscape;
  if (!url) return null;

  return { url, provider: "pexels" };
}

export async function searchPixabay(query: string): Promise<StockImageResult | null> {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return null;

  const data = await fetchJson<{
    hits?: { largeImageURL?: string; user?: string }[];
  }>(
    `https://pixabay.com/api/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=3&safesearch=true`,
  );

  const hit = data?.hits?.[0];
  if (!hit?.largeImageURL) return null;

  return { url: hit.largeImageURL, provider: "pixabay" };
}

export async function searchUnsplash(query: string): Promise<StockImageResult | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  const data = await fetchJson<{
    results?: {
      urls?: { regular?: string };
      user?: { name?: string };
      links?: { html?: string };
    }[];
  }>(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${key}` } },
  );

  const photo = data?.results?.[0];
  const url = photo?.urls?.regular;
  if (!url) return null;

  const name = photo.user?.name;
  return {
    url,
    provider: "unsplash",
    attribution: name ? `Photo by ${name} on Unsplash` : "Photo on Unsplash",
  };
}

export async function searchOpenverse(query: string): Promise<StockImageResult | null> {
  const data = await fetchJson<{
    results?: { url?: string; title?: string; creator?: string; license?: string }[];
  }>(
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=1&license_type=commercial,modification`,
  );

  const image = data?.results?.[0];
  if (!image?.url) return null;

  const parts = [image.creator, image.license].filter(Boolean);
  return {
    url: image.url,
    provider: "openverse",
    attribution: parts.length ? `${image.title || query} (${parts.join(", ")})` : undefined,
  };
}

export async function searchWikimedia(query: string): Promise<StockImageResult | null> {
  const data = await fetchJson<{
    query?: {
      pages?: Record<
        string,
        { title?: string; imageinfo?: { url?: string; extmetadata?: { Artist?: { value?: string } } }[] }
      >;
    };
  }>(
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=1600&format=json&origin=*`,
  );

  const page = Object.values(data?.query?.pages || {})[0];
  const url = page?.imageinfo?.[0]?.url;
  if (!url) return null;

  const artist = page.imageinfo?.[0]?.extmetadata?.Artist?.value;
  return {
    url,
    provider: "wikimedia",
    attribution: artist ? `${page.title} — ${artist.replace(/<[^>]+>/g, "")}` : page.title,
  };
}

export function configuredImageProviders(): StockImageProvider[] {
  const providers: StockImageProvider[] = [];
  if (process.env.PEXELS_API_KEY) providers.push("pexels");
  if (process.env.PIXABAY_API_KEY) providers.push("pixabay");
  if (process.env.UNSPLASH_ACCESS_KEY) providers.push("unsplash");
  providers.push("openverse", "wikimedia", "static");
  return providers;
}

export async function searchStockImage(query: string): Promise<StockImageResult | null> {
  const chain = [
    searchPexels,
    searchPixabay,
    searchUnsplash,
    searchOpenverse,
    searchWikimedia,
  ] as const;

  for (const search of chain) {
    const result = await search(query);
    if (result) return result;
  }

  return null;
}
