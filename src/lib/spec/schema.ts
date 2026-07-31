import { z } from "zod";
import { SECTION_REGISTRY } from "@/lib/sections/registry";
import { SITE_THEMES } from "@/lib/themes";

export const SECTION_IDS = SECTION_REGISTRY.map((s) => s.id) as [
  string,
  ...string[],
];

export const SectionIdSchema = z.enum(SECTION_IDS);
export type SectionId = z.infer<typeof SectionIdSchema>;

export const SiteThemeSchema = z.enum(SITE_THEMES);

export const PlanPageSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  intent: z.string().min(1),
});

export const PlanSchema = z.object({
  theme: SiteThemeSchema,
  brand: z.string().min(1),
  pages: z.array(PlanPageSchema).min(1).max(2),
});

export type Plan = z.infer<typeof PlanSchema>;

export const StructureSchema = z.object({
  sections: z.array(SectionIdSchema).min(5).max(8),
});

export type Structure = z.infer<typeof StructureSchema>;

/** Hex colour only — these values are injected into inline styles, so keep them unambiguous. */
export const HexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a hex colour like #2563EB");

export const RadiusSchema = z.enum(["none", "small", "medium", "large"]);

export const ButtonSizeSchema = z.enum(["small", "medium", "large"]);

/** Fonts we already load from Google Fonts for the built-in themes. */
export const SPEC_FONTS = [
  "Archivo",
  "Inter",
  "Instrument Serif",
  "Manrope",
  "Playfair Display",
  "DM Sans",
  "Space Grotesk",
] as const;

export const SpecFontSchema = z.enum(SPEC_FONTS);

/**
 * Overrides layered on top of the theme preset. Every field is optional so that
 * specs saved before design tokens existed still parse.
 */
export const DesignTokensSchema = z.object({
  primary: HexColorSchema.optional(),
  accent: HexColorSchema.optional(),
  surface: HexColorSchema.optional(),
  surfaceAlt: HexColorSchema.optional(),
  text: HexColorSchema.optional(),
  muted: HexColorSchema.optional(),
  buttonBg: HexColorSchema.optional(),
  buttonText: HexColorSchema.optional(),
  buttonSize: ButtonSizeSchema.optional(),
  radius: RadiusSchema.optional(),
  displayFont: SpecFontSchema.optional(),
  bodyFont: SpecFontSchema.optional(),
});

export type DesignTokens = z.infer<typeof DesignTokensSchema>;

export const DESIGN_TOKEN_KEYS = Object.keys(
  DesignTokensSchema.shape,
) as (keyof DesignTokens)[];

export const SpecSectionSchema = z.object({
  id: SectionIdSchema,
  /** Stable instance key ("home.hero_split#0") so refinements can address one section. */
  key: z.string().min(1).optional(),
  content: z.record(z.string(), z.unknown()),
  /** Design token overrides scoped to this section. */
  tokens: DesignTokensSchema.optional(),
});

export const SpecPageSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  sections: z.array(SpecSectionSchema).min(5).max(9),
});

export const SiteSpecSchema = z.object({
  theme: SiteThemeSchema,
  brand: z.string().min(1),
  seo: z
    .object({
      title: z.string(),
      description: z.string(),
      keywords: z.array(z.string()).max(12).optional(),
      ogImage: z.string().optional(),
    })
    .optional(),
  /** Site-wide design token overrides. */
  design: DesignTokensSchema.optional(),
  pages: z.array(SpecPageSchema).min(1),
});

export type SiteSpec = z.infer<typeof SiteSpecSchema>;

export const PageContentSchema = z.object({
  sections: z.array(SpecSectionSchema),
});

export type PageContent = z.infer<typeof PageContentSchema>;

export const DEFAULT_SECTIONS: SectionId[] = [
  "hero_split",
  "features_3col",
  "about_text",
  "testimonial_single",
  "faq_accordion",
  "contact_form",
  "footer_simple",
];

export function parsePlan(input: unknown): Plan | null {
  const r = PlanSchema.safeParse(input);
  return r.success ? r.data : null;
}

export function parseStructure(input: unknown): Structure | null {
  const r = StructureSchema.safeParse(input);
  return r.success ? r.data : null;
}

export function parsePageContent(input: unknown): PageContent | null {
  const r = PageContentSchema.safeParse(input);
  return r.success ? r.data : null;
}

export function parseSiteSpec(input: unknown): SiteSpec | null {
  const r = SiteSpecSchema.safeParse(input);
  return r.success ? r.data : null;
}

export function sectionKey(
  pageSlug: string,
  sectionId: string,
  index: number,
): string {
  return `${pageSlug}.${sectionId}#${index}`;
}

export function componentKey(sectionKeyValue: string, slot: string): string {
  return `${sectionKeyValue}.${slot}`;
}

/**
 * Fill in any missing section keys deterministically. Older specs were saved
 * without keys, so this runs on load as well as after generation.
 */
export function withSectionKeys(spec: SiteSpec): SiteSpec {
  return {
    ...spec,
    pages: spec.pages.map((page) => ({
      ...page,
      sections: page.sections.map((section, i) => ({
        ...section,
        key: section.key || sectionKey(page.slug, section.id, i),
      })),
    })),
  };
}
