import { SECTION_BY_ID } from "@/lib/sections/registry";
import type { SectionId } from "./schema";
import { SECTION_IDS } from "./schema";

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function isTopSection(id: SectionId): boolean {
  return SECTION_BY_ID[id]?.position === "top";
}

export function normalizeStructure(sections: SectionId[]): SectionId[] {
  let ids = sections.filter((id) => SECTION_IDS.includes(id));

  const hasTop = ids.some(isTopSection);
  if (!hasTop) {
    ids = ["hero_split", ...ids];
  }

  ids = ids.filter((id) => id !== "footer_simple");
  ids.push("footer_simple");

  const seen = new Set<SectionId>();
  const deduped: SectionId[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    deduped.push(id);
  }

  while (deduped.length < 5) {
    if (!deduped.includes("about_text")) deduped.splice(-1, 0, "about_text");
    else if (!deduped.includes("features_3col"))
      deduped.splice(-1, 0, "features_3col");
    else break;
  }

  return deduped.slice(0, 8);
}

export function validateStructure(sections: SectionId[]): string | null {
  if (sections.length < 5 || sections.length > 8) {
    return `Expected 5–8 sections, got ${sections.length}`;
  }
  if (!isTopSection(sections[0])) {
    return "First section must be hero_centered or hero_split";
  }
  if (sections[sections.length - 1] !== "footer_simple") {
    return "Last section must be footer_simple";
  }
  for (const id of sections) {
    if (!SECTION_BY_ID[id]) return `Unknown section id: ${id}`;
  }
  return null;
}

function textSlot(
  content: Record<string, unknown>,
  key: string,
  maxWords: number,
): string | null {
  const val = content[key];
  if (typeof val !== "string" || !val.trim()) {
    return `Missing or empty slot: ${key}`;
  }
  const words = countWords(val);
  if (words > maxWords) {
    return `Slot ${key} exceeds ${maxWords} words (${words})`;
  }
  return null;
}

export function validateSectionContent(
  id: SectionId,
  content: Record<string, unknown>,
): string | null {
  const meta = SECTION_BY_ID[id];
  if (!meta) return `Unknown section: ${id}`;

  for (const [key, slot] of Object.entries(meta.slots)) {
    if (slot.type === "text" && slot.maxWords) {
      const err = textSlot(content, key, slot.maxWords);
      if (err) return err;
    }
    if (slot.type === "list") {
      const val = content[key];
      if (!Array.isArray(val)) return `Slot ${key} must be an array`;
      const min = slot.minItems ?? 1;
      const max = slot.maxItems ?? 10;
      if (val.length < min || val.length > max) {
        return `Slot ${key} needs ${min}–${max} items, got ${val.length}`;
      }
    }
    if (slot.type === "image" && slot.query) {
      const img = content[key];
      if (
        !img ||
        typeof img !== "object" ||
        typeof (img as { query?: string }).query !== "string"
      ) {
        return `Slot ${key} needs { "query": "..." }`;
      }
    }
  }
  return null;
}

export function truncateToWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(" ");
}
