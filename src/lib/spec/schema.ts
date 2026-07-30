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

export const SpecSectionSchema = z.object({
  id: SectionIdSchema,
  content: z.record(z.string(), z.unknown()),
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
    })
    .optional(),
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
