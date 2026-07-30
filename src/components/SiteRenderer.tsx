import type { ComponentType, CSSProperties } from "react";
import type { Page, Section, Theme, Website } from "@/lib/schema";
import * as S from "./sections";

/**
 * Maps a section "type" from AI JSON to a React component.
 * Add a section: schema → prompt → registry line.
 */
const REGISTRY = {
  nav: S.Nav,
  hero: S.Hero,
  features: S.Features,
  about: S.About,
  gallery: S.Gallery,
  pricing: S.Pricing,
  testimonials: S.Testimonials,
  faq: S.Faq,
  cta: S.Cta,
  contact: S.Contact,
  products: S.Products,
  booking: S.Booking,
  checkout: S.Checkout,
  footer: S.Footer,
} as const;

const RADIUS = {
  none: "0px",
  small: "4px",
  medium: "10px",
  large: "20px",
} as const;

export function themeVars(theme: Theme): CSSProperties {
  return {
    "--primary": theme.primary,
    "--accent": theme.accent,
    "--surface": theme.surface,
    "--surface-alt": theme.surfaceAlt || theme.surface,
    "--text": theme.text,
    "--muted": theme.muted,
    "--display": `"${theme.displayFont}", Georgia, serif`,
    "--body": `"${theme.bodyFont}", system-ui, sans-serif`,
    "--radius": RADIUS[theme.radius || "medium"],
    background: theme.surface,
    color: theme.text,
    fontFamily: `"${theme.bodyFont}", system-ui, sans-serif`,
    minHeight: "100%",
  } as CSSProperties;
}

export function ThemeFonts({ theme }: { theme: Theme }) {
  const families = [theme.displayFont, theme.bodyFont]
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`)
    .join("&");
  return (
    <link
      rel="stylesheet"
      href={`https://fonts.googleapis.com/css2?${families}&display=swap`}
    />
  );
}

function RenderSection({ section }: { section: Section }) {
  const Component = REGISTRY[section.type] as ComponentType<Section> | undefined;
  if (!Component) return null;
  return <Component {...section} />;
}

export function SiteRenderer({
  page,
  theme,
}: {
  page: Page;
  theme: Theme;
}) {
  return (
    <div style={themeVars(theme)}>
      {page.sections.map((section, i) => (
        <RenderSection key={`${section.type}-${i}`} section={section} />
      ))}
    </div>
  );
}

/** Multi-page shell: home visible; other pages toggled via hash / data-page links. */
export function WebsiteRenderer({
  site,
  pageId,
}: {
  site: Website;
  pageId?: string;
}) {
  const activeId = pageId || site.pages[0]?.id;
  return (
    <div style={themeVars(site.theme)}>
      {site.pages.map((page) => (
        <div
          key={page.id}
          data-page={page.id}
          style={{ display: page.id === activeId ? "block" : "none" }}
        >
          {page.sections.map((section, i) => (
            <RenderSection key={`${page.id}-${section.type}-${i}`} section={section} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default SiteRenderer;
