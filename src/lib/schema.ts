import { z } from "zod";

/** Shared theme tokens the renderer maps to CSS variables. */
export const ThemeSchema = z.object({
  primary: z.string().min(1),
  accent: z.string().min(1),
  surface: z.string().min(1),
  surfaceAlt: z.string().min(1).optional(),
  text: z.string().min(1),
  muted: z.string().min(1),
  displayFont: z.string().min(1),
  bodyFont: z.string().min(1),
  radius: z.enum(["none", "small", "medium", "large"]).default("medium"),
});

export type Theme = z.infer<typeof ThemeSchema>;

const LinkSchema = z.object({
  label: z.string(),
  href: z.string().default("#"),
});

const NavSection = z.object({
  type: z.literal("nav"),
  brand: z.string(),
  links: z.array(LinkSchema).default([]),
  cta: LinkSchema.optional(),
});

const HeroSection = z.object({
  type: z.literal("hero"),
  brand: z.string().optional(),
  headline: z.string(),
  subheadline: z.string(),
  primaryCta: LinkSchema,
  secondaryCta: LinkSchema.optional(),
  imageUrl: z.string().optional(),
  layout: z.enum(["fullscreen", "split"]).default("fullscreen"),
});

const FeaturesSection = z.object({
  type: z.literal("features"),
  headline: z.string(),
  subheadline: z.string().optional(),
  items: z
    .array(
      z.object({
        title: z.string(),
        body: z.string(),
        icon: z.string().optional(),
      }),
    )
    .min(1)
    .max(6),
});

const AboutSection = z.object({
  type: z.literal("about"),
  headline: z.string(),
  body: z.string(),
  imageUrl: z.string().optional(),
  stats: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .optional(),
});

const GallerySection = z.object({
  type: z.literal("gallery"),
  headline: z.string(),
  subheadline: z.string().optional(),
  images: z
    .array(
      z.object({
        url: z.string(),
        alt: z.string().optional(),
        caption: z.string().optional(),
      }),
    )
    .min(1)
    .max(8),
});

const PricingSection = z.object({
  type: z.literal("pricing"),
  headline: z.string(),
  subheadline: z.string().optional(),
  plans: z
    .array(
      z.object({
        name: z.string(),
        price: z.string(),
        period: z.string().optional(),
        description: z.string().optional(),
        features: z.array(z.string()).default([]),
        cta: LinkSchema,
        highlighted: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(4),
});

const TestimonialsSection = z.object({
  type: z.literal("testimonials"),
  headline: z.string(),
  items: z
    .array(
      z.object({
        quote: z.string(),
        name: z.string(),
        role: z.string().optional(),
      }),
    )
    .min(1)
    .max(6),
});

const FaqSection = z.object({
  type: z.literal("faq"),
  headline: z.string(),
  items: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .min(1)
    .max(10),
});

const CtaSection = z.object({
  type: z.literal("cta"),
  headline: z.string(),
  body: z.string().optional(),
  cta: LinkSchema,
});

const ContactSection = z.object({
  type: z.literal("contact"),
  headline: z.string(),
  body: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  cta: LinkSchema.optional(),
});

const ProductsSection = z.object({
  type: z.literal("products"),
  headline: z.string(),
  subheadline: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        price: z.string().optional(),
        imageUrl: z.string().optional(),
        href: z.string().optional(),
      }),
    )
    .min(1)
    .max(8),
});

const FooterSection = z.object({
  type: z.literal("footer"),
  brand: z.string(),
  tagline: z.string().optional(),
  links: z.array(LinkSchema).default([]),
  copyright: z.string().optional(),
});

export const SectionSchema = z.discriminatedUnion("type", [
  NavSection,
  HeroSection,
  FeaturesSection,
  AboutSection,
  GallerySection,
  PricingSection,
  TestimonialsSection,
  FaqSection,
  CtaSection,
  ContactSection,
  ProductsSection,
  FooterSection,
]);

export type Section = z.infer<typeof SectionSchema>;

export const PageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  path: z.string().min(1).default("/"),
  sections: z.array(SectionSchema).min(1),
});

export type Page = z.infer<typeof PageSchema>;

/** Source-of-truth contract for AI-generated multi-page sites. */
export const WebsiteSchema = z.object({
  brand: z.string().min(1),
  theme: ThemeSchema,
  pages: z.array(PageSchema).min(1),
});

export type Website = z.infer<typeof WebsiteSchema>;

export const SECTION_TYPES = [
  "nav",
  "hero",
  "features",
  "about",
  "gallery",
  "pricing",
  "testimonials",
  "faq",
  "cta",
  "contact",
  "products",
  "footer",
] as const;

export function parseWebsite(input: unknown): Website | null {
  const parsed = WebsiteSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}
