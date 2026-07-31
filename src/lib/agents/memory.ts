/**
 * Project memory: a structural model of what a generated site actually
 * contains, derived from the spec and persisted alongside it.
 *
 * Everything here is pure so it can be unit-tested without a database or a
 * model call. Persistence lives in `memory-store.ts`.
 */

import { SECTION_BY_ID, SECTION_REGISTRY } from "@/lib/sections/registry";
import {
  componentKey,
  sectionKey,
  withSectionKeys,
  type DesignTokens,
  type SiteSpec,
} from "@/lib/spec/schema";
import { resolveSpecTokens } from "@/lib/themes/layout";
import type { SiteThemeName } from "@/lib/themes";
import { extractColor, shade } from "./colors";
import type { ResolvedTarget, TargetProperty, TargetResolution } from "./types";

export type ComponentKind = "button" | "heading" | "text" | "image" | "list";

export type MemoryComponentNode = {
  key: string;
  sectionKey: string;
  slot: string;
  kind: ComponentKind;
  value: string;
};

export type MemorySectionNode = {
  key: string;
  type: string;
  purpose: string;
  index: number;
  pageSlug: string;
  tokens?: DesignTokens;
  components: MemoryComponentNode[];
};

export type MemoryPageNode = {
  slug: string;
  title: string;
  sections: MemorySectionNode[];
};

export type ProjectMemoryModel = {
  brand: string;
  theme: SiteThemeName;
  design: DesignTokens;
  /** Theme preset merged with overrides — what the site actually renders as. */
  effectiveTokens: ReturnType<typeof resolveSpecTokens>;
  pages: MemoryPageNode[];
  revision: number;
};

const BUTTON_SLOTS = /^(cta|submit|button|action)/i;
const HEADING_SLOTS = /^(headline|title|heading)/i;

export function componentKindFor(
  sectionType: string,
  slot: string,
): ComponentKind {
  const meta = SECTION_BY_ID[sectionType];
  const slotMeta = meta?.slots?.[slot];
  if (slotMeta?.type === "image") return "image";
  if (slotMeta?.type === "list") return "list";
  if (BUTTON_SLOTS.test(slot)) return "button";
  if (HEADING_SLOTS.test(slot)) return "heading";
  return "text";
}

function summarizeValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return `${value.length} items`;
  if (value && typeof value === "object") {
    const query = (value as { query?: unknown }).query;
    if (typeof query === "string") return `image: ${query}`;
    return "object";
  }
  return "";
}

export function buildMemory(
  spec: SiteSpec,
  revision = 1,
): ProjectMemoryModel {
  const keyed = withSectionKeys(spec);
  const theme = keyed.theme as SiteThemeName;

  const pages: MemoryPageNode[] = keyed.pages.map((page) => ({
    slug: page.slug,
    title: page.title,
    sections: page.sections.map((section, index) => {
      const key = section.key || sectionKey(page.slug, section.id, index);
      const meta = SECTION_BY_ID[section.id];
      const slots = meta ? Object.keys(meta.slots) : Object.keys(section.content);
      const seen = new Set(slots);
      for (const slot of Object.keys(section.content)) {
        if (!seen.has(slot)) slots.push(slot);
      }

      return {
        key,
        type: section.id,
        purpose: meta?.purpose || section.id,
        index,
        pageSlug: page.slug,
        tokens: section.tokens,
        components: slots.map((slot) => ({
          key: componentKey(key, slot),
          sectionKey: key,
          slot,
          kind: componentKindFor(section.id, slot),
          value: summarizeValue(section.content[slot]),
        })),
      };
    }),
  }));

  return {
    brand: keyed.brand,
    theme,
    design: keyed.design || {},
    effectiveTokens: resolveSpecTokens(theme, keyed.design),
    pages,
    revision,
  };
}

export function allSections(memory: ProjectMemoryModel): MemorySectionNode[] {
  return memory.pages.flatMap((p) => p.sections);
}

export function findSection(
  memory: ProjectMemoryModel,
  key: string,
): MemorySectionNode | undefined {
  return allSections(memory).find((s) => s.key === key);
}

export function componentsOfKind(
  memory: ProjectMemoryModel,
  kind: ComponentKind,
): MemoryComponentNode[] {
  return allSections(memory).flatMap((s) =>
    s.components.filter((c) => c.kind === kind),
  );
}

/** Compact site inventory injected into agent prompts. Kept small on purpose. */
export function memoryDigest(memory: ProjectMemoryModel): string {
  const tokens = memory.effectiveTokens;
  const lines: string[] = [
    `Brand: ${memory.brand}`,
    `Theme: ${memory.theme}`,
    `Design tokens: accent=${tokens.accent} surface=${tokens.surface} text=${tokens.text} muted=${tokens.muted} radius=${tokens.radius} buttonBg=${tokens.buttonBg || "(inherits accent)"}`,
  ];

  for (const page of memory.pages) {
    lines.push(`Page "${page.slug}" (${page.title}):`);
    for (const section of page.sections) {
      const slots = section.components
        .map((c) => `${c.slot}:${c.kind}`)
        .join(", ");
      const override = section.tokens
        ? ` [overrides: ${Object.keys(section.tokens).join(",")}]`
        : "";
      lines.push(`  ${section.key} (${section.type})${override} — ${slots}`);
    }
  }

  return lines.join("\n");
}

/** Recent edits, so the planner knows what has already been tried. */
export function formatChangeHistory(
  entries: { request: string; summary: string; createdAt: Date | string }[],
): string {
  if (entries.length === 0) return "No previous edits.";
  return entries
    .slice(0, 8)
    .map((e) => `- "${e.request}" → ${e.summary}`)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Deterministic target resolution
// ---------------------------------------------------------------------------

const SECTION_ALIASES: Record<string, string[]> = {
  hero: ["hero_centered", "hero_split"],
  banner: ["hero_centered", "hero_split"],
  header: ["hero_centered", "hero_split"],
  features: ["features_3col", "feature_image_left", "feature_image_right"],
  services: ["features_3col"],
  pricing: ["pricing_3tier"],
  plans: ["pricing_3tier"],
  faq: ["faq_accordion"],
  questions: ["faq_accordion"],
  about: ["about_text"],
  story: ["about_text"],
  testimonial: ["testimonial_single"],
  review: ["testimonial_single"],
  quote: ["testimonial_single"],
  contact: ["contact_form"],
  form: ["contact_form"],
  footer: ["footer_simple"],
  logos: ["logos_strip"],
  cta: ["cta_band"],
};

const COMPONENT_NOUNS: { pattern: RegExp; kind: ComponentKind }[] = [
  { pattern: /\b(button|buttons|cta button|call to action)\b/, kind: "button" },
  { pattern: /\b(headline|heading|title|h1)\b/, kind: "heading" },
  { pattern: /\b(image|photo|picture|banner image)\b/, kind: "image" },
  { pattern: /\b(subhead|subheading|paragraph|body copy|description|text)\b/, kind: "text" },
];

const PROPERTY_PATTERNS: { pattern: RegExp; property: TargetProperty }[] = [
  { pattern: /\b(colou?r|background|bg|shade|tint|darker|lighter)\b/, property: "color" },
  { pattern: /\b(rounded|radius|corners|square|pill)\b/, property: "radius" },
  { pattern: /\b(font|typeface|typography)\b/, property: "font" },
  { pattern: /\b(image|photo|picture)\b/, property: "image" },
  { pattern: /\b(reorder|move|order|position|layout)\b/, property: "layout" },
  { pattern: /\b(bigger|larger|smaller|size)\b/, property: "size" },
  { pattern: /\b(add|insert|include)\b.+\b(section|pricing|faq|blog|testimonial)/, property: "structure" },
];

const ADDABLE_ALIASES: { pattern: RegExp; sectionId: string }[] = [
  { pattern: /\b(pricing|price|plans|tiers)\b/, sectionId: "pricing_3tier" },
  { pattern: /\b(faq|questions)\b/, sectionId: "faq_accordion" },
  { pattern: /\b(blog|journal|articles|posts)\b/, sectionId: "blog_teasers" },
  { pattern: /\b(testimonial|review|quote)\b/, sectionId: "testimonial_single" },
  { pattern: /\b(logos?|clients?|partners?)\b/, sectionId: "logos_strip" },
  { pattern: /\b(cta|call to action)\b/, sectionId: "cta_band" },
];

function detectSections(
  memory: ProjectMemoryModel,
  request: string,
): MemorySectionNode[] {
  const lower = request.toLowerCase();
  const sections = allSections(memory);

  const exact = sections.filter((s) => lower.includes(s.key.toLowerCase()));
  if (exact.length) return exact;

  const byType = sections.filter((s) => lower.includes(s.type.toLowerCase()));
  if (byType.length) return byType;

  const matched: MemorySectionNode[] = [];
  for (const [alias, types] of Object.entries(SECTION_ALIASES)) {
    if (!new RegExp(`\\b${alias}\\b`).test(lower)) continue;
    matched.push(...sections.filter((s) => types.includes(s.type)));
  }
  return [...new Set(matched)];
}

function detectComponentKind(request: string): ComponentKind | null {
  const lower = request.toLowerCase();
  for (const { pattern, kind } of COMPONENT_NOUNS) {
    if (pattern.test(lower)) return kind;
  }
  return null;
}

function detectProperty(request: string): TargetProperty | null {
  const lower = request.toLowerCase();
  for (const { pattern, property } of PROPERTY_PATTERNS) {
    if (pattern.test(lower)) return property;
  }
  return null;
}

function detectRadius(request: string): DesignTokens["radius"] | null {
  const lower = request.toLowerCase();
  if (/\b(square|sharp|no rounding|not rounded)\b/.test(lower)) return "none";
  if (/\b(very rounded|pill|fully rounded|round)\b/.test(lower)) return "large";
  if (/\b(slightly rounded|subtle rounding)\b/.test(lower)) return "small";
  if (/\brounded\b/.test(lower)) return "medium";
  return null;
}

/**
 * Map a plain-English request onto concrete addresses in project memory.
 *
 * "change the button color to blue" → design token `buttonBg` = #2563EB,
 * high confidence, which the orchestrator applies without any model call.
 * Adding a scope word ("the hero button") narrows it to that section's own
 * token override instead of the whole site.
 */
export function resolveTargets(
  memory: ProjectMemoryModel,
  request: string,
): TargetResolution {
  const property = detectProperty(request);
  const color = extractColor(request);
  const kind = detectComponentKind(request);
  const sections = detectSections(memory, request);
  const targets: ResolvedTarget[] = [];
  const lower = request.toLowerCase();

  // "add pricing" / "add a blog section" → structural patch
  if (
    /\b(add|insert|include|put)\b/.test(lower) &&
    (property === "structure" ||
      ADDABLE_ALIASES.some((a) => a.pattern.test(lower)))
  ) {
    for (const alias of ADDABLE_ALIASES) {
      if (!alias.pattern.test(lower)) continue;
      const exists = allSections(memory).some((s) => s.type === alias.sectionId);
      if (exists) continue;
      const pageSlug = memory.pages[0]?.slug || "home";
      targets.push({
        kind: "add_section",
        sectionId: alias.sectionId,
        pageSlug,
        label: `add ${alias.sectionId}`,
      });
    }
    if (targets.length > 0) {
      return {
        targets,
        confidence: "high",
        property: "structure",
        reason: `Add section request: ${targets.map((t) => t.label).join(", ")}`,
      };
    }
  }

  // "make the button bigger/smaller"
  if (
    (property === "size" || /\b(bigger|larger|smaller|huge)\b/.test(lower)) &&
    (kind === "button" || /\bbutton\b/.test(lower) || /\bcta\b/.test(lower))
  ) {
    const size = /\b(smaller|tiny|compact)\b/.test(lower)
      ? "small"
      : /\b(bigger|larger|huge|large)\b/.test(lower)
        ? "large"
        : "medium";
    if (sections.length > 0) {
      for (const section of sections) {
        targets.push({
          kind: "section_token",
          sectionKey: section.key,
          token: "buttonSize",
          value: size,
          label: `${section.type} buttonSize`,
        });
      }
    } else {
      targets.push({
        kind: "design_token",
        token: "buttonSize",
        value: size,
        label: "site buttonSize",
      });
    }
    return {
      targets,
      confidence: "high",
      property: "size",
      reason: `Button size request mapped to buttonSize=${size}`,
    };
  }

  // "make this section darker" without a named colour
  if (
    /\b(darker|darken|more dark)\b/.test(lower) &&
    sections.length > 0 &&
    !color
  ) {
    for (const section of sections) {
      const current =
        section.tokens?.surface ||
        memory.design.surface ||
        memory.effectiveTokens.surface ||
        "#FFFFFF";
      const next = shade(current, -0.25);
      targets.push({
        kind: "section_token",
        sectionKey: section.key,
        token: "surface",
        value: next,
        label: `${section.type} surface`,
      });
    }
    return {
      targets,
      confidence: "high",
      property: "color",
      color: targets[0] && "value" in targets[0] ? targets[0].value : undefined,
      reason: `Darken request scoped to ${sections.map((s) => s.key).join(", ")}`,
    };
  }

  if (/\b(lighter|lighten|brighter)\b/.test(lower) && sections.length > 0 && !color) {
    for (const section of sections) {
      const current =
        section.tokens?.surface ||
        memory.design.surface ||
        memory.effectiveTokens.surface ||
        "#111111";
      const next = shade(current, 0.25);
      targets.push({
        kind: "section_token",
        sectionKey: section.key,
        token: "surface",
        value: next,
        label: `${section.type} surface`,
      });
    }
    return {
      targets,
      confidence: "high",
      property: "color",
      reason: `Lighten request scoped to ${sections.map((s) => s.key).join(", ")}`,
    };
  }

  const colorProperty = property === "color" || (color !== null && kind !== null);

  if (colorProperty && color) {
    const backgroundRequested = /\bbackground|\bbg\b/.test(request.toLowerCase());
    const token: keyof DesignTokens =
      kind === "button"
        ? "buttonBg"
        : kind === "heading" || kind === "text"
          ? "text"
          : backgroundRequested
            ? "surface"
            : "accent";

    if (sections.length > 0) {
      for (const section of sections) {
        targets.push({
          kind: "section_token",
          sectionKey: section.key,
          token,
          value: color,
          label: `${section.type} ${token}`,
        });
      }
    } else {
      targets.push({
        kind: "design_token",
        token,
        value: color,
        label: `site ${token}`,
      });
    }

    return {
      targets,
      confidence: "high",
      property: "color",
      color,
      reason:
        sections.length > 0
          ? `Colour request scoped to ${sections.map((s) => s.key).join(", ")}`
          : `Site-wide colour request mapped to design token ${token}`,
    };
  }

  if (property === "radius") {
    const radius = detectRadius(request);
    if (radius) {
      targets.push({
        kind: "design_token",
        token: "radius",
        value: radius,
        label: "site radius",
      });
      return {
        targets,
        confidence: "high",
        property: "radius",
        reason: `Corner rounding mapped to design token radius=${radius}`,
      };
    }
  }

  if (kind && sections.length > 0) {
    for (const section of sections) {
      for (const component of section.components) {
        if (component.kind !== kind) continue;
        targets.push({
          kind: "slot",
          sectionKey: section.key,
          slot: component.slot,
          value: component.value,
          label: component.key,
        });
      }
    }
    if (targets.length) {
      return {
        targets,
        confidence: "medium",
        property,
        reason: `Matched ${kind} components inside ${sections.map((s) => s.key).join(", ")}`,
      };
    }
  }

  if (kind) {
    for (const component of componentsOfKind(memory, kind)) {
      targets.push({
        kind: "slot",
        sectionKey: component.sectionKey,
        slot: component.slot,
        value: component.value,
        label: component.key,
      });
    }
    if (targets.length) {
      return {
        targets,
        confidence: "medium",
        property,
        reason: `Matched every ${kind} component on the site`,
      };
    }
  }

  if (sections.length > 0) {
    for (const section of sections) {
      targets.push({
        kind: "section",
        sectionKey: section.key,
        label: section.type,
      });
    }
    return {
      targets,
      confidence: "medium",
      property,
      reason: `Scoped to ${sections.map((s) => s.key).join(", ")}`,
    };
  }

  return {
    targets: [{ kind: "site", label: "whole site" }],
    confidence: "low",
    property,
    reason: "No specific section or component matched — the model must decide",
  };
}

/** Section types the planner may add, for prompt grounding. */
export function addableSectionTypes(): string[] {
  return SECTION_REGISTRY.filter((s) => s.position === "body").map((s) => s.id);
}
