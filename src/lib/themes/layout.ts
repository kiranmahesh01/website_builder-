import type { CSSProperties } from "react";
import { getThemeTokens, type SiteThemeName } from "@/lib/themes";
import type { DesignTokens } from "@/lib/spec/schema";

export type ThemeLayout = {
  sectionPadding: string;
  maxBodyWidth: string;
  h1: string;
  h2: string;
  body: string;
  buttonStyle: "solid" | "outline" | "pill";
  letterSpacing?: string;
};

export function getThemeLayout(theme: SiteThemeName): ThemeLayout {
  switch (theme) {
    case "bold_startup":
      return {
        sectionPadding: "96px 0",
        maxBodyWidth: "65ch",
        h1: "clamp(2.25rem, 5vw, 3.75rem)",
        h2: "clamp(1.75rem, 3vw, 2.5rem)",
        body: "1rem",
        buttonStyle: "solid",
      };
    case "warm_editorial":
      return {
        sectionPadding: "128px 0",
        maxBodyWidth: "65ch",
        h1: "clamp(2.5rem, 5vw, 4rem)",
        h2: "clamp(1.85rem, 3vw, 2.875rem)",
        body: "1.0625rem",
        buttonStyle: "outline",
        letterSpacing: "0.04em",
      };
    case "minimal_studio":
      return {
        sectionPadding: "80px 0",
        maxBodyWidth: "65ch",
        h1: "clamp(2rem, 4vw, 3.375rem)",
        h2: "clamp(1.5rem, 3vw, 2.5rem)",
        body: "0.9375rem",
        buttonStyle: "pill",
      };
  }
}

function radiusToPx(radius: string | undefined): string {
  switch (radius) {
    case "none":
      return "0";
    case "small":
      return "8px";
    case "large":
      return "16px";
    default:
      return "10px";
  }
}

/** Theme preset merged with the project's design token overrides. */
export function resolveSpecTokens(
  theme: SiteThemeName,
  overrides?: DesignTokens,
) {
  const base = getThemeTokens(theme);
  return {
    primary: overrides?.primary || base.primary,
    accent: overrides?.accent || base.accent,
    surface: overrides?.surface || base.surface,
    surfaceAlt: overrides?.surfaceAlt || base.surfaceAlt || base.surface,
    text: overrides?.text || base.text,
    muted: overrides?.muted || base.muted,
    displayFont: overrides?.displayFont || base.displayFont,
    bodyFont: overrides?.bodyFont || base.bodyFont,
    radius: overrides?.radius || base.radius,
    buttonBg: overrides?.buttonBg,
    buttonText: overrides?.buttonText,
  };
}

export function specThemeVars(
  theme: SiteThemeName,
  overrides?: DesignTokens,
): CSSProperties {
  const t = resolveSpecTokens(theme, overrides);
  return {
    "--primary": t.primary,
    "--accent": t.accent,
    "--surface": t.surface,
    "--surface-alt": t.surfaceAlt,
    "--text": t.text,
    "--muted": t.muted,
    ...(t.buttonBg ? { "--button-bg": t.buttonBg } : {}),
    ...(t.buttonText ? { "--button-text": t.buttonText } : {}),
    "--display": `"${t.displayFont}", Georgia, serif`,
    "--body": `"${t.bodyFont}", system-ui, sans-serif`,
    "--radius": radiusToPx(t.radius),
    background: t.surface,
    color: t.text,
    fontFamily: `"${t.bodyFont}", system-ui, sans-serif`,
    minHeight: "100%",
  } as CSSProperties;
}

/** Section-scoped overrides — only emits the vars that were actually set. */
export function sectionTokenVars(
  overrides?: DesignTokens,
): CSSProperties | undefined {
  if (!overrides) return undefined;
  const vars: Record<string, string> = {};
  if (overrides.accent) vars["--accent"] = overrides.accent;
  if (overrides.surface) vars["--surface"] = overrides.surface;
  if (overrides.surfaceAlt) vars["--surface-alt"] = overrides.surfaceAlt;
  if (overrides.text) vars["--text"] = overrides.text;
  if (overrides.muted) vars["--muted"] = overrides.muted;
  if (overrides.buttonBg) vars["--button-bg"] = overrides.buttonBg;
  if (overrides.buttonText) vars["--button-text"] = overrides.buttonText;
  if (overrides.radius) vars["--radius"] = radiusToPx(overrides.radius);
  if (overrides.displayFont) {
    vars["--display"] = `"${overrides.displayFont}", Georgia, serif`;
  }
  if (overrides.bodyFont) {
    vars["--body"] = `"${overrides.bodyFont}", system-ui, sans-serif`;
  }
  if (Object.keys(vars).length === 0) return undefined;
  if (overrides.surface) vars.background = overrides.surface;
  if (overrides.text) vars.color = overrides.text;
  return vars as CSSProperties;
}
