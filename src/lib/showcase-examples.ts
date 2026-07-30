import type { Website } from "@/lib/schema";
import type { UiKit } from "@/lib/ui-kits";
import { BENCHMARK_PROMPTS } from "@/lib/benchmark-prompts";
import { buildDemoSpec } from "@/lib/spec/demo-spec";
import { specToWebsite } from "@/lib/spec/to-website";
import type { SiteSpec } from "@/lib/spec/schema";

export type ShowcaseExample = {
  slug: string;
  title: string;
  category: string;
  prompt: string;
  uiKit: UiKit;
  theme?: "bold_startup" | "warm_editorial" | "minimal_studio";
  spec: SiteSpec;
  site: Website;
};

const DEFINITIONS: Omit<ShowcaseExample, "site" | "spec">[] = [
  ...BENCHMARK_PROMPTS.map((b) => ({
    slug: b.slug,
    title: b.title,
    category: b.category,
    prompt: b.prompt,
    uiKit: b.uiKit as UiKit,
    theme: b.theme,
  })),
  {
    slug: "harbor-roastery",
    title: "Harbor Roastery",
    category: "Coffee & café",
    prompt:
      "Harbor Roastery in Portland — single-origin pour-overs, pastry case, hours, and pickup window. Warm rustic vibe.",
    uiKit: "shadcn",
  },
  {
    slug: "studio-meridian",
    title: "Studio Meridian",
    category: "Portfolio",
    prompt:
      "Studio Meridian — product designer portfolio, case studies, minimal editorial layout, contact for freelance.",
    uiKit: "shadcn",
  },
  {
    slug: "petal-stem",
    title: "Petal & Stem",
    category: "Shop",
    prompt:
      "Petal & Stem orchid boutique in Brooklyn — online shop, local pickup, gallery of rare plants, green accents.",
    uiKit: "preline",
  },
  {
    slug: "flow-state",
    title: "Flow State Yoga",
    category: "Wellness",
    prompt:
      "Flow State Yoga studio in Austin — class schedule, intro offer, instructor bios, booking CTA.",
    uiKit: "preline",
  },
  {
    slug: "taskwell",
    title: "Taskwell",
    category: "SaaS",
    prompt:
      "Taskwell — async team task app for remote startups. Pricing tiers, feature grid, testimonials, free trial.",
    uiKit: "shadcn",
  },
  {
    slug: "kumo-ryokan",
    title: "Kumo Ryokan",
    category: "Hospitality",
    prompt:
      "Kumo Ryokan — boutique inn in Kyoto. Rooms, onsen hours, seasonal kaiseki, reservation form, serene Japanese aesthetic.",
    uiKit: "preline",
  },
  {
    slug: "ironworks-gym",
    title: "Ironworks Gym",
    category: "Fitness",
    prompt:
      "Ironworks Gym — strength training in Chicago. Membership plans, coach profiles, class timetable, bold industrial look.",
    uiKit: "shadcn",
  },
  {
    slug: "northline-legal",
    title: "Northline Legal",
    category: "Professional services",
    prompt:
      "Northline Legal — small business law in Seattle. Practice areas, attorney team, consultation booking, trustworthy navy palette.",
    uiKit: "shadcn",
  },
];

export const SHOWCASE_EXAMPLES: ShowcaseExample[] = DEFINITIONS.map((def) => {
  const spec = buildDemoSpec(def.prompt, def.theme ?? "warm_editorial");
  const site = specToWebsite(spec, { uiKit: def.uiKit, theme: def.theme });
  return { ...def, spec, site };
});

export const SHOWCASE_BY_SLUG = Object.fromEntries(
  SHOWCASE_EXAMPLES.map((ex) => [ex.slug, ex]),
) as Record<string, ShowcaseExample>;
