import type { Theme } from "@/lib/schema";
import type { UiKit } from "@/lib/ui-kits";

export const SITE_THEMES = [
  "bold_startup",
  "warm_editorial",
  "minimal_studio",
] as const;

export type SiteThemeName = (typeof SITE_THEMES)[number];

export const SITE_THEME_LABELS: Record<SiteThemeName, string> = {
  bold_startup: "Bold startup",
  warm_editorial: "Warm editorial",
  minimal_studio: "Minimal studio",
};

export const SITE_THEME_DESCRIPTIONS: Record<SiteThemeName, string> = {
  bold_startup: "Clean, confident — saturated accent on white",
  warm_editorial: "Serif headlines, warm off-white, terracotta accent",
  minimal_studio: "Dark background, soft pill buttons, cool accent",
};

export const DEFAULT_SITE_THEME: SiteThemeName = "bold_startup";

export function normalizeSiteTheme(value?: string | null): SiteThemeName {
  if (value && SITE_THEMES.includes(value as SiteThemeName)) {
    return value as SiteThemeName;
  }
  return DEFAULT_SITE_THEME;
}

/** Internal kit — users pick a feeling, not a component library. */
export function themeToUiKit(theme: SiteThemeName): UiKit {
  switch (theme) {
    case "bold_startup":
      return "shadcn";
    case "warm_editorial":
      return "preline";
    case "minimal_studio":
      return "shadcn";
  }
}

export function getThemeTokens(theme: SiteThemeName): Theme {
  switch (theme) {
    case "bold_startup":
      return {
        primary: "#111827",
        accent: "#4F46E5",
        surface: "#FFFFFF",
        surfaceAlt: "#F9FAFB",
        text: "#111827",
        muted: "#6B7280",
        displayFont: "Archivo",
        bodyFont: "Inter",
        radius: "small",
      };
    case "warm_editorial":
      return {
        primary: "#3D3630",
        accent: "#C2543A",
        surface: "#FAF8F4",
        surfaceAlt: "#F3EFE8",
        text: "#3D3630",
        muted: "#7A7268",
        displayFont: "Instrument Serif",
        bodyFont: "Inter",
        radius: "none",
      };
    case "minimal_studio":
      return {
        primary: "#E8E8EA",
        accent: "#7FD4C1",
        surface: "#111214",
        surfaceAlt: "#1A1B1F",
        text: "#E8E8EA",
        muted: "#9CA3AF",
        displayFont: "Manrope",
        bodyFont: "Manrope",
        radius: "large",
      };
  }
}

export function pickThemeFromBrief(prompt: string): SiteThemeName {
  const p = prompt.toLowerCase();
  if (/dark|night|studio|minimal|monochrome|tech|developer/.test(p)) {
    return "minimal_studio";
  }
  if (/warm|editorial|rustic|artisan|boutique|cozy|organic|serif/.test(p)) {
    return "warm_editorial";
  }
  if (/startup|saas|bold|modern|agency|product|app/.test(p)) {
    return "bold_startup";
  }
  return DEFAULT_SITE_THEME;
}
