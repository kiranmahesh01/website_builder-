import type { ComponentType, CSSProperties } from "react";
import type { Page, Section, Theme, Website } from "@/lib/schema";
import { getSectionComponent } from "./kits/registry";
import { normalizeUiKit } from "@/lib/ui-kits";

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

function RenderSection({
  section,
  uiKit,
}: {
  section: Section;
  uiKit: ReturnType<typeof normalizeUiKit>;
}) {
  const Component = getSectionComponent(uiKit, section.type) as
    | ComponentType<Section>
    | undefined;
  if (!Component) return null;
  return <Component {...section} />;
}

export function SiteRenderer({
  page,
  theme,
  uiKit = "daisyui",
}: {
  page: Page;
  theme: Theme;
  uiKit?: Website["uiKit"];
}) {
  const kit = normalizeUiKit(uiKit);
  const useMagicVars = kit === "magic";

  return (
    <div style={useMagicVars ? themeVars(theme) : undefined}>
      {page.sections.map((section, i) => (
        <RenderSection key={`${section.type}-${i}`} section={section} uiKit={kit} />
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
  const kit = normalizeUiKit(site.uiKit);
  const useMagicVars = kit === "magic";

  return (
    <div style={useMagicVars ? themeVars(site.theme) : undefined}>
      {site.pages.map((page) => (
        <div
          key={page.id}
          data-page={page.id}
          style={{ display: page.id === activeId ? "block" : "none" }}
        >
          {page.sections.map((section, i) => (
            <RenderSection
              key={`${page.id}-${section.type}-${i}`}
              section={section}
              uiKit={kit}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default SiteRenderer;
