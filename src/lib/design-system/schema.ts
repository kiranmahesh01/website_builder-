import { z } from "zod";
import { DesignTokensSchema } from "@/lib/spec/schema";

/**
 * Structured Design System produced before generate.
 * Tokens map onto SiteSpec.design; componentStyles guide copy/layout prompts.
 */
export const DesignSystemSchema = z.object({
  name: z.string(),
  industry: z.string(),
  style: z.string(),
  colors: z.object({
    primary: z.string(),
    accent: z.string(),
    surface: z.string(),
    surfaceAlt: z.string().optional(),
    text: z.string(),
    muted: z.string().optional(),
    buttonBg: z.string().optional(),
    buttonText: z.string().optional(),
  }),
  typography: z.object({
    displayFont: z.string(),
    bodyFont: z.string(),
    scale: z.enum(["compact", "comfortable", "expressive"]),
  }),
  spacing: z.object({
    sectionY: z.enum(["tight", "normal", "airy"]),
    contentMax: z.enum(["narrow", "default", "wide"]),
  }),
  buttons: z.object({
    size: z.enum(["sm", "md", "lg"]),
    radius: z.enum(["sm", "md", "lg", "full"]),
    strength: z.enum(["soft", "medium", "strong"]),
    primaryLabelHint: z.string(),
  }),
  componentStyles: z.object({
    hero: z.string(),
    cards: z.string(),
    nav: z.string(),
    footer: z.string(),
  }),
  /** Flattened tokens for SiteSpec.design */
  tokens: DesignTokensSchema,
  source: z.enum(["dna", "brand-kit", "merged"]),
});

export type DesignSystem = z.infer<typeof DesignSystemSchema>;
