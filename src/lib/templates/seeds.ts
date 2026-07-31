/**
 * Compact seed vocabulary expanded by scripts/build-templates.ts into ~300
 * AI-ready templates. All section ids must exist in SECTION_REGISTRY.
 */

import type { DesignTokens, SectionId } from "@/lib/spec/schema";
import type { SiteThemeName } from "@/lib/themes";
import type { CopyPatterns, TemplateCategory, TemplateStyle } from "./types";

export type IndustrySeed = {
  industry: string;
  category: TemplateCategory;
  keywords: string[];
  defaultTheme: SiteThemeName;
  defaultStyle: TemplateStyle;
};

export type LayoutVariant = {
  id: string;
  sections: SectionId[];
};

export type PaletteSeed = {
  id: string;
  theme: SiteThemeName;
  tokens: DesignTokens;
};

export const INDUSTRY_SEEDS: IndustrySeed[] = [
  // Landing (~ many industries → ~100 after expansion)
  {
    industry: "agency",
    category: "landing",
    keywords: ["agency", "marketing", "branding", "advertising", "campaigns"],
    defaultTheme: "bold_startup",
    defaultStyle: "bold",
  },
  {
    industry: "dental",
    category: "landing",
    keywords: ["dental", "dentist", "clinic", "smile", "orthodont"],
    defaultTheme: "bold_startup",
    defaultStyle: "modern",
  },
  {
    industry: "hotel",
    category: "landing",
    keywords: ["hotel", "resort", "lodge", "boutique hotel", "stay", "rooms"],
    defaultTheme: "warm_editorial",
    defaultStyle: "premium",
  },
  {
    industry: "gym",
    category: "landing",
    keywords: ["gym", "fitness", "crossfit", "training", "membership"],
    defaultTheme: "bold_startup",
    defaultStyle: "bold",
  },
  {
    industry: "legal",
    category: "landing",
    keywords: ["legal", "law", "attorney", "lawyer", "firm"],
    defaultTheme: "minimal_studio",
    defaultStyle: "classic",
  },
  {
    industry: "realestate",
    category: "landing",
    keywords: ["real estate", "realtor", "property", "homes", "listing"],
    defaultTheme: "warm_editorial",
    defaultStyle: "premium",
  },
  {
    industry: "education",
    category: "landing",
    keywords: ["school", "course", "tutoring", "academy", "learning"],
    defaultTheme: "bold_startup",
    defaultStyle: "modern",
  },
  {
    industry: "nonprofit",
    category: "landing",
    keywords: ["nonprofit", "charity", "foundation", "donate", "cause"],
    defaultTheme: "warm_editorial",
    defaultStyle: "warm",
  },
  {
    industry: "events",
    category: "landing",
    keywords: ["events", "wedding", "planner", "conference", "venue"],
    defaultTheme: "warm_editorial",
    defaultStyle: "editorial",
  },
  {
    industry: "consulting",
    category: "landing",
    keywords: ["consulting", "consultant", "advisor", "strategy", "coach"],
    defaultTheme: "minimal_studio",
    defaultStyle: "minimal",
  },
  {
    industry: "salon",
    category: "landing",
    keywords: ["salon", "hair", "spa", "beauty", "barber"],
    defaultTheme: "warm_editorial",
    defaultStyle: "premium",
  },
  {
    industry: "medical",
    category: "landing",
    keywords: ["medical", "clinic", "doctor", "health", "wellness"],
    defaultTheme: "bold_startup",
    defaultStyle: "modern",
  },
  {
    industry: "finance",
    category: "landing",
    keywords: ["finance", "accounting", "tax", "wealth", "advisor"],
    defaultTheme: "minimal_studio",
    defaultStyle: "classic",
  },
  {
    industry: "automotive",
    category: "landing",
    keywords: ["auto", "garage", "mechanic", "dealership", "car"],
    defaultTheme: "bold_startup",
    defaultStyle: "bold",
  },
  {
    industry: "construction",
    category: "landing",
    keywords: ["construction", "contractor", "renovation", "builder"],
    defaultTheme: "bold_startup",
    defaultStyle: "classic",
  },
  {
    industry: "pet",
    category: "landing",
    keywords: ["pet", "vet", "grooming", "dog", "cat"],
    defaultTheme: "warm_editorial",
    defaultStyle: "playful",
  },
  {
    industry: "photography",
    category: "landing",
    keywords: ["photography", "photographer", "studio session"],
    defaultTheme: "minimal_studio",
    defaultStyle: "editorial",
  },
  {
    industry: "travel",
    category: "landing",
    keywords: ["travel", "tour", "vacation", "adventure"],
    defaultTheme: "warm_editorial",
    defaultStyle: "warm",
  },
  {
    industry: "music",
    category: "landing",
    keywords: ["music", "band", "dj", "studio music"],
    defaultTheme: "minimal_studio",
    defaultStyle: "bold",
  },
  {
    industry: "coworking",
    category: "landing",
    keywords: ["coworking", "workspace", "office space", "desk"],
    defaultTheme: "bold_startup",
    defaultStyle: "modern",
  },

  // SaaS
  {
    industry: "saas",
    category: "saas",
    keywords: ["saas", "software", "platform", "app", "subscription", "b2b"],
    defaultTheme: "bold_startup",
    defaultStyle: "bold",
  },
  {
    industry: "analytics",
    category: "saas",
    keywords: ["analytics", "dashboard", "metrics", "insights", "data"],
    defaultTheme: "bold_startup",
    defaultStyle: "modern",
  },
  {
    industry: "crm",
    category: "saas",
    keywords: ["crm", "sales", "pipeline", "leads tool"],
    defaultTheme: "bold_startup",
    defaultStyle: "premium",
  },
  {
    industry: "devtools",
    category: "saas",
    keywords: ["developer", "api", "devops", "infrastructure", "sdk"],
    defaultTheme: "minimal_studio",
    defaultStyle: "minimal",
  },
  {
    industry: "hrtech",
    category: "saas",
    keywords: ["hr", "payroll", "hiring", "people ops"],
    defaultTheme: "bold_startup",
    defaultStyle: "modern",
  },
  {
    industry: "fintech",
    category: "saas",
    keywords: ["fintech", "payments", "billing", "invoicing"],
    defaultTheme: "minimal_studio",
    defaultStyle: "premium",
  },
  {
    industry: "martech",
    category: "saas",
    keywords: ["email marketing", "automation", "campaign tool"],
    defaultTheme: "bold_startup",
    defaultStyle: "playful",
  },
  {
    industry: "productivity",
    category: "saas",
    keywords: ["productivity", "tasks", "notes", "collaboration"],
    defaultTheme: "bold_startup",
    defaultStyle: "minimal",
  },
  {
    industry: "security",
    category: "saas",
    keywords: ["security", "compliance", "identity", "auth"],
    defaultTheme: "minimal_studio",
    defaultStyle: "classic",
  },
  {
    industry: "ai_tool",
    category: "saas",
    keywords: ["ai tool", "machine learning", "copilot", "llm"],
    defaultTheme: "bold_startup",
    defaultStyle: "bold",
  },

  // Restaurant / food
  {
    industry: "restaurant",
    category: "restaurant",
    keywords: ["restaurant", "dining", "cuisine", "chef", "bistro"],
    defaultTheme: "warm_editorial",
    defaultStyle: "warm",
  },
  {
    industry: "bakery",
    category: "restaurant",
    keywords: ["bakery", "pastry", "sourdough", "bread", "patisserie"],
    defaultTheme: "warm_editorial",
    defaultStyle: "warm",
  },
  {
    industry: "cafe",
    category: "restaurant",
    keywords: ["cafe", "coffee", "espresso", "latte"],
    defaultTheme: "warm_editorial",
    defaultStyle: "editorial",
  },
  {
    industry: "bar",
    category: "restaurant",
    keywords: ["bar", "cocktails", "wine bar", "nightlife"],
    defaultTheme: "minimal_studio",
    defaultStyle: "premium",
  },
  {
    industry: "foodtruck",
    category: "restaurant",
    keywords: ["food truck", "street food", "catering"],
    defaultTheme: "bold_startup",
    defaultStyle: "playful",
  },
  {
    industry: "pizza",
    category: "restaurant",
    keywords: ["pizza", "pizzeria", "slice"],
    defaultTheme: "warm_editorial",
    defaultStyle: "bold",
  },
  {
    industry: "sushi",
    category: "restaurant",
    keywords: ["sushi", "japanese", "omakase"],
    defaultTheme: "minimal_studio",
    defaultStyle: "minimal",
  },
  {
    industry: "vegan",
    category: "restaurant",
    keywords: ["vegan", "plant-based", "vegetarian"],
    defaultTheme: "warm_editorial",
    defaultStyle: "modern",
  },
  {
    industry: "steakhouse",
    category: "restaurant",
    keywords: ["steakhouse", "steak", "grill"],
    defaultTheme: "warm_editorial",
    defaultStyle: "premium",
  },
  {
    industry: "brunch",
    category: "restaurant",
    keywords: ["brunch", "breakfast", "pancakes"],
    defaultTheme: "warm_editorial",
    defaultStyle: "playful",
  },

  // Portfolio
  {
    industry: "portfolio",
    category: "portfolio",
    keywords: ["portfolio", "designer", "freelancer", "creative"],
    defaultTheme: "minimal_studio",
    defaultStyle: "minimal",
  },
  {
    industry: "illustrator",
    category: "portfolio",
    keywords: ["illustrator", "illustration", "artist"],
    defaultTheme: "warm_editorial",
    defaultStyle: "editorial",
  },
  {
    industry: "architect",
    category: "portfolio",
    keywords: ["architect", "architecture", "interior design"],
    defaultTheme: "minimal_studio",
    defaultStyle: "classic",
  },
  {
    industry: "writer",
    category: "portfolio",
    keywords: ["writer", "copywriter", "author", "journalist"],
    defaultTheme: "warm_editorial",
    defaultStyle: "editorial",
  },
  {
    industry: "developer_folio",
    category: "portfolio",
    keywords: ["developer portfolio", "engineer portfolio", "frontend portfolio"],
    defaultTheme: "minimal_studio",
    defaultStyle: "modern",
  },
  {
    industry: "ux",
    category: "portfolio",
    keywords: ["ux", "product designer", "ui designer"],
    defaultTheme: "minimal_studio",
    defaultStyle: "minimal",
  },
  {
    industry: "filmmaker",
    category: "portfolio",
    keywords: ["filmmaker", "videographer", "director"],
    defaultTheme: "minimal_studio",
    defaultStyle: "bold",
  },
  {
    industry: "stylist",
    category: "portfolio",
    keywords: ["stylist", "fashion stylist", "wardrobe"],
    defaultTheme: "warm_editorial",
    defaultStyle: "premium",
  },
  {
    industry: "musician_folio",
    category: "portfolio",
    keywords: ["musician portfolio", "composer", "producer"],
    defaultTheme: "minimal_studio",
    defaultStyle: "editorial",
  },
  {
    industry: "craft",
    category: "portfolio",
    keywords: ["maker", "ceramics", "craft", "artisan portfolio"],
    defaultTheme: "warm_editorial",
    defaultStyle: "warm",
  },

  // Ecommerce / service
  {
    industry: "boutique",
    category: "ecommerce",
    keywords: ["boutique", "shop", "store", "retail", "florist"],
    defaultTheme: "warm_editorial",
    defaultStyle: "warm",
  },
  {
    industry: "apparel",
    category: "ecommerce",
    keywords: ["apparel", "clothing", "fashion shop", "streetwear"],
    defaultTheme: "minimal_studio",
    defaultStyle: "bold",
  },
  {
    industry: "jewelry",
    category: "ecommerce",
    keywords: ["jewelry", "jewellery", "rings", "goldsmith"],
    defaultTheme: "warm_editorial",
    defaultStyle: "premium",
  },
  {
    industry: "home_goods",
    category: "ecommerce",
    keywords: ["home goods", "furniture", "decor", "interiors shop"],
    defaultTheme: "warm_editorial",
    defaultStyle: "editorial",
  },
  {
    industry: "electronics",
    category: "ecommerce",
    keywords: ["electronics", "gadgets", "tech shop"],
    defaultTheme: "bold_startup",
    defaultStyle: "modern",
  },
  {
    industry: "beauty_shop",
    category: "ecommerce",
    keywords: ["skincare", "cosmetics", "beauty shop"],
    defaultTheme: "warm_editorial",
    defaultStyle: "premium",
  },
  {
    industry: "marketplace",
    category: "ecommerce",
    keywords: ["marketplace", "multi-vendor", "sellers"],
    defaultTheme: "bold_startup",
    defaultStyle: "bold",
  },
  {
    industry: "subscription_box",
    category: "ecommerce",
    keywords: ["subscription box", "monthly box", "curated box"],
    defaultTheme: "warm_editorial",
    defaultStyle: "playful",
  },
  {
    industry: "service_pro",
    category: "ecommerce",
    keywords: ["service business", "plumber", "cleaner", "handyman"],
    defaultTheme: "bold_startup",
    defaultStyle: "classic",
  },
  {
    industry: "digital_goods",
    category: "ecommerce",
    keywords: ["digital downloads", "templates shop", "ebooks"],
    defaultTheme: "bold_startup",
    defaultStyle: "modern",
  },
];

/** Layout variants keyed by category — each must validate (5–8, hero→footer). */
export const LAYOUTS_BY_CATEGORY: Record<TemplateCategory, LayoutVariant[]> = {
  landing: [
    {
      id: "trust",
      sections: [
        "hero_split",
        "features_3col",
        "about_text",
        "testimonial_single",
        "cta_band",
        "contact_form",
        "footer_simple",
      ],
    },
    {
      id: "proof",
      sections: [
        "hero_centered",
        "logos_strip",
        "features_3col",
        "faq_accordion",
        "cta_band",
        "contact_form",
        "footer_simple",
      ],
    },
    {
      id: "story",
      sections: [
        "hero_split",
        "feature_image_left",
        "about_text",
        "testimonial_single",
        "faq_accordion",
        "contact_form",
        "footer_simple",
      ],
    },
    {
      id: "convert",
      sections: [
        "hero_centered",
        "features_3col",
        "pricing_3tier",
        "faq_accordion",
        "cta_band",
        "footer_simple",
      ],
    },
    {
      id: "content",
      sections: [
        "hero_split",
        "features_3col",
        "blog_teasers",
        "about_text",
        "cta_band",
        "contact_form",
        "footer_simple",
      ],
    },
  ],
  saas: [
    {
      id: "classic",
      sections: [
        "hero_split",
        "logos_strip",
        "features_3col",
        "pricing_3tier",
        "testimonial_single",
        "faq_accordion",
        "cta_band",
        "footer_simple",
      ],
    },
    {
      id: "lean",
      sections: [
        "hero_centered",
        "features_3col",
        "pricing_3tier",
        "faq_accordion",
        "cta_band",
        "footer_simple",
      ],
    },
    {
      id: "product",
      sections: [
        "hero_split",
        "feature_image_left",
        "feature_image_right",
        "pricing_3tier",
        "testimonial_single",
        "cta_band",
        "footer_simple",
      ],
    },
    {
      id: "trust",
      sections: [
        "hero_split",
        "logos_strip",
        "features_3col",
        "testimonial_single",
        "blog_teasers",
        "cta_band",
        "footer_simple",
      ],
    },
    {
      id: "demo",
      sections: [
        "hero_centered",
        "logos_strip",
        "features_3col",
        "pricing_3tier",
        "faq_accordion",
        "contact_form",
        "footer_simple",
      ],
    },
  ],
  restaurant: [
    {
      id: "menu",
      sections: [
        "hero_split",
        "features_3col",
        "about_text",
        "testimonial_single",
        "cta_band",
        "contact_form",
        "footer_simple",
      ],
    },
    {
      id: "reserve",
      sections: [
        "hero_centered",
        "features_3col",
        "faq_accordion",
        "cta_band",
        "contact_form",
        "footer_simple",
      ],
    },
    {
      id: "chef",
      sections: [
        "hero_split",
        "feature_image_left",
        "about_text",
        "testimonial_single",
        "faq_accordion",
        "contact_form",
        "footer_simple",
      ],
    },
    {
      id: "local",
      sections: [
        "hero_split",
        "features_3col",
        "about_text",
        "blog_teasers",
        "contact_form",
        "footer_simple",
      ],
    },
    {
      id: "social",
      sections: [
        "hero_centered",
        "features_3col",
        "testimonial_single",
        "cta_band",
        "contact_form",
        "footer_simple",
      ],
    },
  ],
  portfolio: [
    {
      id: "work",
      sections: [
        "hero_centered",
        "feature_image_left",
        "feature_image_right",
        "about_text",
        "testimonial_single",
        "contact_form",
        "footer_simple",
      ],
    },
    {
      id: "lean",
      sections: [
        "hero_centered",
        "features_3col",
        "about_text",
        "contact_form",
        "footer_simple",
      ],
    },
    {
      id: "case",
      sections: [
        "hero_split",
        "feature_image_left",
        "about_text",
        "testimonial_single",
        "cta_band",
        "contact_form",
        "footer_simple",
      ],
    },
    {
      id: "journal",
      sections: [
        "hero_centered",
        "feature_image_right",
        "blog_teasers",
        "about_text",
        "contact_form",
        "footer_simple",
      ],
    },
    {
      id: "studio",
      sections: [
        "hero_split",
        "features_3col",
        "feature_image_left",
        "testimonial_single",
        "contact_form",
        "footer_simple",
      ],
    },
  ],
  ecommerce: [
    {
      id: "shop",
      sections: [
        "hero_split",
        "features_3col",
        "about_text",
        "testimonial_single",
        "faq_accordion",
        "contact_form",
        "footer_simple",
      ],
    },
    {
      id: "convert",
      sections: [
        "hero_centered",
        "features_3col",
        "pricing_3tier",
        "faq_accordion",
        "cta_band",
        "footer_simple",
      ],
    },
    {
      id: "brand",
      sections: [
        "hero_split",
        "feature_image_left",
        "features_3col",
        "testimonial_single",
        "cta_band",
        "contact_form",
        "footer_simple",
      ],
    },
    {
      id: "service",
      sections: [
        "hero_split",
        "features_3col",
        "faq_accordion",
        "cta_band",
        "contact_form",
        "footer_simple",
      ],
    },
    {
      id: "stories",
      sections: [
        "hero_centered",
        "features_3col",
        "blog_teasers",
        "testimonial_single",
        "contact_form",
        "footer_simple",
      ],
    },
  ],
};

export const STYLE_ORDER: TemplateStyle[] = [
  "premium",
  "minimal",
  "bold",
  "warm",
  "playful",
  "editorial",
  "modern",
  "classic",
];

export const PALETTES: PaletteSeed[] = [
  {
    id: "teal_clean",
    theme: "bold_startup",
    tokens: {
      accent: "#0F766E",
      buttonBg: "#0F766E",
      buttonText: "#ECFDF5",
      primary: "#0F172A",
      surface: "#FFFFFF",
      surfaceAlt: "#F8FAFC",
      text: "#0F172A",
      muted: "#64748B",
      displayFont: "Space Grotesk",
      bodyFont: "Inter",
      radius: "medium",
    },
  },
  {
    id: "orange_punch",
    theme: "bold_startup",
    tokens: {
      accent: "#EA580C",
      buttonBg: "#111827",
      buttonText: "#F9FAFB",
      primary: "#111827",
      surface: "#FFFFFF",
      surfaceAlt: "#F3F4F6",
      text: "#111827",
      muted: "#6B7280",
      displayFont: "Archivo",
      bodyFont: "Inter",
      radius: "small",
    },
  },
  {
    id: "sky_trust",
    theme: "bold_startup",
    tokens: {
      accent: "#0284C7",
      buttonBg: "#0284C7",
      buttonText: "#F0F9FF",
      primary: "#0C4A6E",
      surface: "#FFFFFF",
      surfaceAlt: "#F0F9FF",
      text: "#0F172A",
      muted: "#64748B",
      displayFont: "Manrope",
      bodyFont: "Inter",
      radius: "large",
    },
  },
  {
    id: "forest_energy",
    theme: "bold_startup",
    tokens: {
      accent: "#16A34A",
      buttonBg: "#16A34A",
      buttonText: "#F0FDF4",
      primary: "#14532D",
      surface: "#FFFFFF",
      surfaceAlt: "#F0FDF4",
      text: "#14532D",
      muted: "#4B5563",
      displayFont: "Space Grotesk",
      bodyFont: "Inter",
      radius: "medium",
    },
  },
  {
    id: "amber_editorial",
    theme: "warm_editorial",
    tokens: {
      accent: "#B45309",
      buttonBg: "#B45309",
      buttonText: "#FFFBEB",
      surface: "#FFFBF5",
      surfaceAlt: "#F5EDE3",
      text: "#292524",
      muted: "#78716C",
      displayFont: "Playfair Display",
      bodyFont: "DM Sans",
      radius: "small",
    },
  },
  {
    id: "clay_artisan",
    theme: "warm_editorial",
    tokens: {
      accent: "#9A3412",
      buttonBg: "#9A3412",
      buttonText: "#FFF7ED",
      surface: "#FFF7ED",
      surfaceAlt: "#FFEDD5",
      text: "#431407",
      muted: "#9A3412",
      displayFont: "Instrument Serif",
      bodyFont: "DM Sans",
      radius: "medium",
    },
  },
  {
    id: "rose_boutique",
    theme: "warm_editorial",
    tokens: {
      accent: "#BE185D",
      buttonBg: "#BE185D",
      buttonText: "#FDF2F8",
      surface: "#FFF1F2",
      surfaceAlt: "#FFE4E6",
      text: "#1F2937",
      muted: "#6B7280",
      displayFont: "Instrument Serif",
      bodyFont: "DM Sans",
      radius: "medium",
    },
  },
  {
    id: "hotel_quiet",
    theme: "warm_editorial",
    tokens: {
      accent: "#1F4E46",
      buttonBg: "#1F4E46",
      buttonText: "#F4F7F6",
      surface: "#F7F4EF",
      surfaceAlt: "#EFE9E0",
      text: "#1C1917",
      muted: "#78716C",
      displayFont: "Playfair Display",
      bodyFont: "Inter",
      radius: "small",
    },
  },
  {
    id: "studio_dark",
    theme: "minimal_studio",
    tokens: {
      accent: "#D4A373",
      buttonBg: "#E8E8EA",
      buttonText: "#111214",
      surface: "#111214",
      surfaceAlt: "#1A1B1F",
      text: "#E8E8EA",
      muted: "#9CA3AF",
      displayFont: "Manrope",
      bodyFont: "Manrope",
      radius: "none",
    },
  },
  {
    id: "ink_mono",
    theme: "minimal_studio",
    tokens: {
      accent: "#A3A3A3",
      buttonBg: "#FAFAFA",
      buttonText: "#0A0A0A",
      surface: "#0A0A0A",
      surfaceAlt: "#171717",
      text: "#FAFAFA",
      muted: "#A3A3A3",
      displayFont: "Archivo",
      bodyFont: "Inter",
      radius: "none",
    },
  },
  {
    id: "violet_night",
    theme: "minimal_studio",
    tokens: {
      accent: "#C4B5FD",
      buttonBg: "#C4B5FD",
      buttonText: "#1E1B4B",
      surface: "#0F0A1A",
      surfaceAlt: "#1A1230",
      text: "#F5F3FF",
      muted: "#A78BFA",
      displayFont: "Space Grotesk",
      bodyFont: "Inter",
      radius: "medium",
    },
  },
  {
    id: "sand_quiet",
    theme: "warm_editorial",
    tokens: {
      accent: "#78716C",
      buttonBg: "#44403C",
      buttonText: "#FAFAF9",
      surface: "#FAFAF9",
      surfaceAlt: "#F5F5F4",
      text: "#1C1917",
      muted: "#78716C",
      displayFont: "Instrument Serif",
      bodyFont: "Inter",
      radius: "small",
    },
  },
];

export function copyPatternsFor(
  industry: string,
  category: TemplateCategory,
  style: TemplateStyle,
): CopyPatterns {
  const ctaByCategory: Record<TemplateCategory, string[]> = {
    landing: ["Get started", "Book a call", "Learn more"],
    saas: ["Start free", "Book a demo", "Try it free"],
    restaurant: ["Reserve a table", "Order now", "View the menu"],
    portfolio: ["View work", "Hire me", "Start a project"],
    ecommerce: ["Shop now", "Add to cart", "Browse collection"],
  };

  const toneByStyle: Record<TemplateStyle, string[]> = {
    premium: ["Calm, specific, never salesy", "Lead with craft and place"],
    minimal: ["Spare language; one idea per line", "No buzzwords"],
    bold: ["Lead with the outcome", "Short, confident verbs"],
    warm: ["Inviting and sensory", "Name real products and places"],
    playful: ["Light wit without slang overload", "Concrete offers"],
    editorial: ["Magazine-like specificity", "Strong nouns over adjectives"],
    modern: ["Clear job-to-be-done", "Action-oriented CTAs"],
    classic: ["Trustworthy and plainspoken", "Avoid hype"],
  };

  const avoid = [
    "No lorem ipsum or placeholder brand names",
    "Avoid purple-glow startup clichés unless asked",
    category === "restaurant" || category === "ecommerce"
      ? "No SaaS pricing ladders unless the brief asks"
      : "No restaurant/menu language",
  ];

  return {
    headline: [
      `{offer} for {audience}`,
      `{brand} — {promise}`,
      `{outcome} in {city}`,
      style === "premium" ? `Quiet luxury for {audience}` : `{category} that {benefit}`,
    ],
    cta: ctaByCategory[category],
    tone: [
      ...toneByStyle[style],
      `Ground copy in the ${industry} offer from the brief`,
    ],
    avoid,
  };
}

export function layoutRulesFor(
  category: TemplateCategory,
  layoutId: string,
): string[] {
  return [
    "Hero first, footer last",
    `Use the ${layoutId} layout for ${category}`,
    "Keep 5–8 sections total",
    category === "saas"
      ? "Pricing before FAQ when both appear"
      : "Contact or CTA near the end",
  ];
}

export function titleCase(industry: string): string {
  return industry
    .split(/[_-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function styleLabel(style: TemplateStyle): string {
  return style.charAt(0).toUpperCase() + style.slice(1);
}
