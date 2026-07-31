import type { Website } from "@/lib/schema";
import { parseWebsite } from "@/lib/schema";
import type { SiteSpec } from "@/lib/spec/schema";
import { parseSiteSpec } from "@/lib/spec/schema";

/** Persisted brand kit snapshot (optional on project data). */
export type StoredBrandKit = {
  businessName: string;
  tagline: string;
  description: string;
  logoIdea: string;
  colors: {
    primary: string;
    accent: string;
    surface: string;
    text: string;
  };
  fonts: {
    display: string;
    body: string;
  };
  audience: string;
  socialPosts: string[];
  source?: string;
};

export type ProjectSiteData = {
  version: 2;
  spec: SiteSpec;
  website: Website;
  brandKit?: StoredBrandKit;
};

export function serializeProjectData(input: {
  spec: SiteSpec;
  website: Website;
  brandKit?: StoredBrandKit | null;
}): string {
  const payload: ProjectSiteData = {
    version: 2,
    spec: input.spec,
    website: input.website,
    ...(input.brandKit ? { brandKit: input.brandKit } : {}),
  };
  return JSON.stringify(payload);
}

export function deserializeProjectData(raw: unknown): ProjectSiteData | null {
  if (!raw) return null;
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  if (obj.version === 2 && obj.spec && obj.website) {
    const spec = parseSiteSpec(obj.spec);
    const website = parseWebsite(obj.website);
    if (spec && website) {
      return {
        version: 2,
        spec,
        website,
        brandKit: (obj.brandKit as StoredBrandKit | undefined) || undefined,
      };
    }
  }
  return null;
}

/** Backward-compatible: returns Website from v2 or legacy data. */
export function serializeSiteData(data: Website | null | undefined): string | null {
  if (!data) return null;
  return JSON.stringify(data);
}

export function deserializeSiteData(raw: unknown): Website | null {
  const project = deserializeProjectData(raw);
  if (project) return project.website;
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return parseWebsite(JSON.parse(raw));
    } catch {
      return null;
    }
  }
  return parseWebsite(raw);
}

export function getSpecFromData(raw: unknown): SiteSpec | null {
  return deserializeProjectData(raw)?.spec ?? null;
}
