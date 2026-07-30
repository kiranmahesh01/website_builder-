export type CompetitorId =
  | "magic-ai"
  | "wegic"
  | "remixer"
  | "sketchflow"
  | "framer"
  | "durable"
  | "pressgo";

export type Competitor = {
  id: CompetitorId;
  name: string;
  tagline: string;
  bestFor: string;
  vibe: string;
};

export type FeatureRow = {
  feature: string;
  values: Record<CompetitorId, boolean | string>;
};

export const COMPETITORS: Competitor[] = [
  {
    id: "magic-ai",
    name: "Magic AI",
    tagline: "Chat → site → publish. Open & exportable.",
    bestFor: "Founders who want speed + ownership",
    vibe: "Wegic-simple, Sketchflow-flexible",
  },
  {
    id: "wegic",
    name: "Wegic",
    tagline: "Text a designer. Live in 60 seconds.",
    bestFor: "Non-technical users, fastest draft",
    vibe: "Pure chat, platform-locked",
  },
  {
    id: "remixer",
    name: "DreamHost Remixer",
    tagline: "Claude-powered full-stack builder.",
    bestFor: "Power users on DreamHost",
    vibe: "Capable, not beginner-friendly",
  },
  {
    id: "sketchflow",
    name: "Sketchflow AI",
    tagline: "Export React or Astro code.",
    bestFor: "Developers who hate lock-in",
    vibe: "Rough UI, real code out",
  },
  {
    id: "framer",
    name: "Framer AI",
    tagline: "Figma-lite polish.",
    bestFor: "Designers who want control",
    vibe: "Best visuals, steep curve",
  },
  {
    id: "durable",
    name: "Durable",
    tagline: "Site + CRM + invoicing in 30s.",
    bestFor: "Plumbers, cleaners, service pros",
    vibe: "Business-in-a-box",
  },
  {
    id: "pressgo",
    name: "PressGo AI",
    tagline: "Claude inside WordPress/Elementor.",
    bestFor: "Existing WordPress sites",
    vibe: "Narrow but deep WP integration",
  },
];

export const FEATURE_MATRIX: FeatureRow[] = [
  {
    feature: "Chat-to-site generation",
    values: {
      "magic-ai": true,
      wegic: true,
      remixer: true,
      sketchflow: true,
      framer: "partial",
      durable: true,
      pressgo: true,
    },
  },
  {
    feature: "One-click publish",
    values: {
      "magic-ai": true,
      wegic: true,
      remixer: true,
      sketchflow: "manual",
      framer: true,
      durable: true,
      pressgo: "WP only",
    },
  },
  {
    feature: "Chat refinement",
    values: {
      "magic-ai": true,
      wegic: true,
      remixer: true,
      sketchflow: true,
      framer: true,
      durable: true,
      pressgo: true,
    },
  },
  {
    feature: "Export React code",
    values: {
      "magic-ai": true,
      wegic: false,
      remixer: false,
      sketchflow: true,
      framer: true,
      durable: false,
      pressgo: false,
    },
  },
  {
    feature: "Export Astro code",
    values: {
      "magic-ai": true,
      wegic: false,
      remixer: false,
      sketchflow: true,
      framer: false,
      durable: false,
      pressgo: false,
    },
  },
  {
    feature: "WordPress export",
    values: {
      "magic-ai": true,
      wegic: false,
      remixer: true,
      sketchflow: false,
      framer: false,
      durable: false,
      pressgo: true,
    },
  },
  {
    feature: "Working contact forms",
    values: {
      "magic-ai": true,
      wegic: true,
      remixer: true,
      sketchflow: "varies",
      framer: true,
      durable: true,
      pressgo: true,
    },
  },
  {
    feature: "Lead inbox / CRM",
    values: {
      "magic-ai": true,
      wegic: "limited",
      remixer: false,
      sketchflow: false,
      framer: false,
      durable: true,
      pressgo: false,
    },
  },
  {
    feature: "Promo video studio",
    values: {
      "magic-ai": true,
      wegic: false,
      remixer: false,
      sketchflow: false,
      framer: false,
      durable: false,
      pressgo: false,
    },
  },
  {
    feature: "No API keys for users",
    values: {
      "magic-ai": true,
      wegic: true,
      remixer: true,
      sketchflow: "varies",
      framer: true,
      durable: true,
      pressgo: "varies",
    },
  },
  {
    feature: "Self-hostable / open",
    values: {
      "magic-ai": true,
      wegic: false,
      remixer: false,
      sketchflow: false,
      framer: false,
      durable: false,
      pressgo: false,
    },
  },
  {
    feature: "Visual canvas editor",
    values: {
      "magic-ai": "partial",
      wegic: "limited",
      remixer: true,
      sketchflow: true,
      framer: true,
      durable: "limited",
      pressgo: "Elementor",
    },
  },
  {
    feature: "Invoicing & email marketing",
    values: {
      "magic-ai": "roadmap",
      wegic: false,
      remixer: false,
      sketchflow: false,
      framer: false,
      durable: true,
      pressgo: false,
    },
  },
];

export const MAGIC_AI_WINS = [
  "Only tool with chat builder + React/Astro/WordPress export + lead inbox + promo video studio",
  "No platform lock-in — self-host on Vercel or export your code",
  "Structured sections with real copy, not generic placeholder swaps",
  "Free tier with live publish — no credit card",
];
