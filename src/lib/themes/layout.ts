import type { CSSProperties } from "react";
import { getThemeTokens, type SiteThemeName } from "@/lib/themes";

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

export function specThemeVars(theme: SiteThemeName): CSSProperties {
  const t = getThemeTokens(theme);
  const radius =
    t.radius === "none"
      ? "0"
      : t.radius === "small"
        ? "8px"
        : t.radius === "large"
          ? "16px"
          : "10px";
  return {
    "--primary": t.primary,
    "--accent": t.accent,
    "--surface": t.surface,
    "--surface-alt": t.surfaceAlt || t.surface,
    "--text": t.text,
    "--muted": t.muted,
    "--display": `"${t.displayFont}", Georgia, serif`,
    "--body": `"${t.bodyFont}", system-ui, sans-serif`,
    "--radius": radius,
    background: t.surface,
    color: t.text,
    fontFamily: `"${t.bodyFont}", system-ui, sans-serif`,
    minHeight: "100%",
  } as CSSProperties;
}
