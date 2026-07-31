import type { WebsiteDna } from "@/lib/dna";
import type { BrandKit } from "@/lib/create/brand-kit";
import { SPEC_FONTS, type DesignTokens } from "@/lib/spec/schema";
import { DesignSystemSchema, type DesignSystem } from "./schema";

const STYLE_FONTS: Record<string, { display: string; body: string }> = {
  minimal: { display: "Manrope", body: "DM Sans" },
  luxury: { display: "Playfair Display", body: "DM Sans" },
  modern: { display: "Space Grotesk", body: "Inter" },
  bold: { display: "Archivo", body: "Inter" },
  corporate: { display: "Manrope", body: "Inter" },
};

function coerceFont(name: string, fallback: string): (typeof SPEC_FONTS)[number] {
  const hit = SPEC_FONTS.find(
    (f) => f.toLowerCase() === name.toLowerCase(),
  );
  if (hit) return hit;
  const fb = SPEC_FONTS.find((f) => f.toLowerCase() === fallback.toLowerCase());
  return fb || "Manrope";
}

function mutedFrom(text: string): string {
  // Soften text hex toward mid gray when possible; fallback.
  if (/^#[0-9a-f]{6}$/i.test(text)) return "#6b6560";
  return "#64748b";
}

function surfaceAlt(surface: string): string {
  if (/^#f/i.test(surface)) return "#efeae3";
  return "#e2e8f0";
}

/**
 * Produce a structured DesignSystem from DNA + optional brand kit + style.
 */
export function generateDesignSystem(input: {
  dna: WebsiteDna;
  style?: string;
  brandKit?: BrandKit | null;
  businessName?: string;
}): DesignSystem {
  const style = (input.style || "minimal").toLowerCase();
  const fonts = STYLE_FONTS[style] || STYLE_FONTS.minimal!;
  const colors = input.brandKit?.colors || {
    primary: input.dna.colors.primary,
    accent: input.dna.colors.accent,
    surface: input.dna.colors.surface,
    text: input.dna.colors.text,
  };
  const display = coerceFont(
    input.brandKit?.fonts.display || fonts.display,
    fonts.display,
  );
  const body = coerceFont(
    input.brandKit?.fonts.body || fonts.body,
    fonts.body,
  );

  const tokens: DesignTokens = {
    primary: colors.primary,
    accent: colors.accent,
    surface: colors.surface,
    surfaceAlt: surfaceAlt(colors.surface),
    text: colors.text,
    muted: mutedFrom(colors.text),
    buttonBg: colors.accent,
    buttonText: "#ffffff",
    buttonSize: input.dna.ctas.strength === "strong" ? "large" : "medium",
    radius: style === "bold" ? "large" : "medium",
    displayFont: display,
    bodyFont: body,
  };

  const raw: DesignSystem = {
    name: `${input.businessName || input.dna.industry} Design System`,
    industry: input.dna.industry,
    style,
    colors: {
      primary: colors.primary,
      accent: colors.accent,
      surface: colors.surface,
      surfaceAlt: tokens.surfaceAlt,
      text: colors.text,
      muted: tokens.muted,
      buttonBg: tokens.buttonBg,
      buttonText: tokens.buttonText,
    },
    typography: {
      displayFont: display,
      bodyFont: body,
      scale:
        style === "bold" || style === "luxury" ? "expressive" : "comfortable",
    },
    spacing: {
      sectionY: style === "luxury" ? "airy" : "normal",
      contentMax: "default",
    },
    buttons: {
      size: input.dna.ctas.strength === "strong" ? "lg" : "md",
      radius: style === "bold" ? "lg" : "md",
      strength: input.dna.ctas.strength,
      primaryLabelHint: input.dna.ctas.primary[0] || "Get started",
    },
    componentStyles: {
      hero: `${input.dna.colors.notes} Full-bleed atmosphere; one headline, one CTA group.`,
      cards:
        "Prefer open layouts over card chrome; use cards only for interactive product/pricing tiles.",
      nav: "Compact brand-first nav; mobile collapses to a single primary CTA + menu.",
      footer: "Utility footer: contact, hours/policies, secondary links — no marketing dump.",
    },
    tokens,
    source: input.brandKit ? "merged" : "dna",
  };

  return DesignSystemSchema.parse(raw);
}

/** Apply DesignSystem tokens onto a SiteSpec-like design field. */
export function designSystemToTokens(ds: DesignSystem): DesignTokens {
  return { ...ds.tokens };
}
