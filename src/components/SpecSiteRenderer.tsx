import type { SiteSpec } from "@/lib/spec/schema";
import { getThemeTokens, type SiteThemeName } from "@/lib/themes";
import { specThemeVars } from "@/lib/themes/layout";
import { SPEC_SECTION_COMPONENTS } from "./spec-sections";
import { SpecNav, SpecWatermark } from "./spec-sections/shared";
import { ThemeFonts } from "./SiteRenderer";

export function SpecSiteRenderer({
  spec,
  watermark = false,
  pageSlug,
  siteSlug,
}: {
  spec: SiteSpec;
  watermark?: boolean;
  pageSlug?: string;
  siteSlug?: string;
}) {
  const theme = spec.theme as SiteThemeName;
  const tokens = getThemeTokens(theme);
  const page = spec.pages.find((p) => p.slug === pageSlug) || spec.pages[0];

  return (
    <>
      <ThemeFonts theme={tokens} />
      <div style={specThemeVars(theme)}>
        <SpecNav brand={spec.brand} />
        {page.sections.map((section, i) => {
          const Component = SPEC_SECTION_COMPONENTS[section.id];
          if (!Component) return null;
          return (
            <Component
              key={`${section.id}-${i}`}
              content={section.content}
              brand={spec.brand}
              theme={theme}
              siteSlug={siteSlug}
            />
          );
        })}
        {watermark ? <SpecWatermark /> : null}
      </div>
    </>
  );
}
