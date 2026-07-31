/**
 * Deterministic AI Brand Kit — logo idea, colors, fonts, tagline, social posts.
 * No LLM required; uses wizard answers + blueprint tokens when available.
 */

import type { CreateWizardAnswers } from "./brief";
import { resolveIndustry, styleLabel, websiteTypeLabel } from "./brief";

export type BrandKit = {
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
  source: "deterministic";
};

const STYLE_PALETTES: Record<
  string,
  { primary: string; accent: string; surface: string; text: string }
> = {
  minimal: {
    primary: "#2c2a26",
    accent: "#8b7355",
    surface: "#f7f4ef",
    text: "#1a1917",
  },
  luxury: {
    primary: "#1c1917",
    accent: "#b08d57",
    surface: "#f5f0e8",
    text: "#141210",
  },
  modern: {
    primary: "#0f172a",
    accent: "#0ea5e9",
    surface: "#f8fafc",
    text: "#0f172a",
  },
  bold: {
    primary: "#111111",
    accent: "#ff6b4a",
    surface: "#ffffff",
    text: "#111111",
  },
  corporate: {
    primary: "#1e3a5f",
    accent: "#3b82f6",
    surface: "#f1f5f9",
    text: "#0f172a",
  },
};

const STYLE_FONTS: Record<string, { display: string; body: string }> = {
  minimal: { display: "Manrope", body: "DM Sans" },
  luxury: { display: "Playfair Display", body: "DM Sans" },
  modern: { display: "Space Grotesk", body: "Inter" },
  bold: { display: "Archivo", body: "Inter" },
  corporate: { display: "Manrope", body: "Inter" },
};

function coffeePalette() {
  return {
    primary: "#3c2a21",
    accent: "#c4a484",
    surface: "#f6f1ea",
    text: "#1f1712",
  };
}

export function buildBrandKit(
  answers: CreateWizardAnswers,
  options?: {
    tokens?: Record<string, string>;
    displayFont?: string;
    bodyFont?: string;
  },
): BrandKit {
  const industry = resolveIndustry(answers);
  const businessName =
    answers.businessName.trim() ||
    `${industry} ${websiteTypeLabel(answers.websiteType)}`;
  const audience =
    answers.targetCustomers.trim() ||
    `People looking for ${industry.toLowerCase()}`;
  const feeling =
    answers.brandFeeling.trim() ||
    `${styleLabel(answers.style)}, grounded in ${industry.toLowerCase()}`;
  const goal =
    answers.goal.trim() ||
    `Help ${audience.toLowerCase()} discover ${businessName}`;

  const palette =
    /coffee|cafe/.test(industry.toLowerCase())
      ? coffeePalette()
      : STYLE_PALETTES[answers.style] || STYLE_PALETTES.minimal;

  const colors = {
    primary: options?.tokens?.primary || options?.tokens?.buttonBg || palette.primary,
    accent: options?.tokens?.accent || palette.accent,
    surface: options?.tokens?.surface || palette.surface,
    text: options?.tokens?.text || palette.text,
  };

  if (answers.colors.trim()) {
    // Keep user color notes in description; hex still from palette/tokens.
  }

  const fonts = STYLE_FONTS[answers.style] || STYLE_FONTS.minimal;
  if (options?.displayFont) fonts.display = options.displayFont;
  if (options?.bodyFont) fonts.body = options.bodyFont;

  const tagline =
    /coffee|cafe/.test(industry.toLowerCase())
      ? "Coffee worth lingering over"
      : `${feeling.split(",")[0]?.trim() || styleLabel(answers.style)} ${industry.toLowerCase()}`;

  const description = `${businessName} is a ${styleLabel(answers.style).toLowerCase()} ${websiteTypeLabel(answers.websiteType).toLowerCase()} for ${industry.toLowerCase()}. ${goal}. Brand feeling: ${feeling}.`;

  const logoIdea = `Wordmark “${businessName.split(" ").slice(0, 2).join(" ")}” in ${fonts.display}, with a simple mark suggesting ${industry.toLowerCase()} — flat, one-color on ${colors.surface}, accent ${colors.accent}.`;

  const socialPosts = [
    `Just launched ${businessName}. ${tagline}. ${goal}.`,
    `Behind the brand: ${feeling}. Built for ${audience}.`,
    answers.websiteType === "store"
      ? `Shop the collection at ${businessName} — ${tagline}.`
      : `What would you ask ${businessName}? Drop a comment — we’re listening.`,
  ];

  return {
    businessName,
    tagline,
    description,
    logoIdea,
    colors,
    fonts,
    audience,
    socialPosts,
    source: "deterministic",
  };
}
