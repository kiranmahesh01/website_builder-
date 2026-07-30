import type { Website } from "@/lib/schema";
import { parseWebsite } from "@/lib/schema";

export function serializeSiteData(data: Website | null | undefined): string | null {
  if (!data) return null;
  return JSON.stringify(data);
}

export function deserializeSiteData(raw: unknown): Website | null {
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
