import type { Website } from "@/lib/schema";

type ThemePick = {
  primary: string;
  accent: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  displayFont: string;
  bodyFont: string;
  image: string;
};

const THEMES: Record<string, ThemePick> = {
  food: {
    primary: "#3d2a1f",
    accent: "#e07a3a",
    surface: "#1a1512",
    surfaceAlt: "#2a211c",
    text: "#f4ebe3",
    muted: "#c4b5a8",
    displayFont: "Fraunces",
    bodyFont: "Figtree",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80",
  },
  fitness: {
    primary: "#16353a",
    accent: "#3dd6c6",
    surface: "#0b0f14",
    surfaceAlt: "#141b24",
    text: "#e8eef5",
    muted: "#9aabbc",
    displayFont: "Bebas Neue",
    bodyFont: "DM Sans",
    image:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=80",
  },
  beauty: {
    primary: "#3a242c",
    accent: "#d4788c",
    surface: "#1c1418",
    surfaceAlt: "#2a1f24",
    text: "#f7ecef",
    muted: "#c9b0b8",
    displayFont: "Cormorant Garamond",
    bodyFont: "Manrope",
    image:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1600&q=80",
  },
  tech: {
    primary: "#1a2740",
    accent: "#5b8def",
    surface: "#0a0c10",
    surfaceAlt: "#12161e",
    text: "#eef2f7",
    muted: "#94a3b8",
    displayFont: "Space Grotesk",
    bodyFont: "Sora",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80",
  },
  nature: {
    primary: "#1f3524",
    accent: "#6fbf73",
    surface: "#0f1612",
    surfaceAlt: "#18241c",
    text: "#eaf3ec",
    muted: "#a3b8a9",
    displayFont: "Libre Baskerville",
    bodyFont: "Source Sans 3",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=80",
  },
  shop: {
    primary: "#3a3218",
    accent: "#f0c75e",
    surface: "#121214",
    surfaceAlt: "#1c1c20",
    text: "#f2f2f4",
    muted: "#a8a8b3",
    displayFont: "Playfair Display",
    bodyFont: "Outfit",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
  },
  default: {
    primary: "#3a2a20",
    accent: "#e8a87c",
    surface: "#101318",
    surfaceAlt: "#181d24",
    text: "#f0f3f7",
    muted: "#9aa7b5",
    displayFont: "Syne",
    bodyFont: "Work Sans",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80",
  },
};

function pickTheme(prompt: string): ThemePick {
  const p = prompt.toLowerCase();
  if (/food|restaurant|cafe|coffee|bakery|kitchen|chef|menu|dining|pizza|sushi/.test(p))
    return THEMES.food;
  if (/fitness|gym|yoga|workout|sport|train|crossfit|health club/.test(p))
    return THEMES.fitness;
  if (/beauty|salon|spa|skincare|cosmetic|hair|nail|wellness/.test(p))
    return THEMES.beauty;
  if (/tech|saas|software|app|ai|startup|developer|cloud|digital/.test(p))
    return THEMES.tech;
  if (/plant|garden|orchid|nature|eco|organic|farm|forest|outdoor|travel/.test(p))
    return THEMES.nature;
  if (/shop|store|boutique|retail|ecommerce|product|merch|market/.test(p))
    return THEMES.shop;
  return THEMES.default;
}

function titleCase(words: string): string {
  return words
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function extractBrand(prompt: string): string {
  const named = prompt.match(
    /(?:called|named|brand(?:ed)?|for)\s+["']?([A-Za-z0-9][A-Za-z0-9 &'-]{1,40})["']?/i,
  );
  if (named?.[1]) return titleCase(named[1].trim());

  const stop = new Set([
    "a", "an", "the", "for", "with", "and", "or", "of", "to", "in", "on", "my",
    "our", "website", "site", "landing", "page", "build", "create", "make",
    "design", "online", "modern", "beautiful", "simple",
  ]);
  const tokens = prompt
    .replace(/[^a-zA-Z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stop.has(t.toLowerCase()));

  if (tokens.length >= 2) return titleCase(tokens.slice(0, 2).join(" "));
  if (tokens[0]) return titleCase(tokens[0]);
  return "Studio North";
}

function applyInstructionTweaks(
  site: Website,
  instruction?: string,
): Website {
  if (!instruction) return site;
  const lower = instruction.toLowerCase();
  const theme = { ...site.theme };
  const home = structuredClone(site.pages[0]);

  if (/darker|dark mode|black/.test(lower)) {
    theme.surface = "#070809";
    theme.surfaceAlt = "#101214";
  }
  if (/lighter|bright|white/.test(lower)) {
    theme.surface = "#f3f1ec";
    theme.surfaceAlt = "#e8e4dc";
    theme.text = "#1a1814";
    theme.muted = "#5c574e";
  }
  if (/green/.test(lower)) theme.accent = "#4caf78";
  if (/blue/.test(lower)) theme.accent = "#4a7fd4";
  if (/orange|warm/.test(lower)) theme.accent = "#e07a3a";
  if (/gold|yellow/.test(lower)) theme.accent = "#d4a84b";

  const quoted = instruction.match(/["']([^"']+)["']/);
  for (const section of home.sections) {
    if (section.type === "hero") {
      if (quoted?.[1] && /headline|title|hero/.test(lower)) {
        section.headline = quoted[1];
      }
      if (quoted?.[1] && /cta|button|call to action/.test(lower)) {
        section.primaryCta.label = quoted[1];
      }
    }
    if (section.type === "nav" && quoted?.[1] && /brand|name|logo/.test(lower)) {
      section.brand = quoted[1];
    }
  }

  if (quoted?.[1] && /brand|name|logo/.test(lower)) {
    site = { ...site, brand: quoted[1] };
  }

  // Add pricing section on request if missing
  if (/pricing|plans|tiers/.test(lower) && !home.sections.some((s) => s.type === "pricing")) {
    const footerIdx = home.sections.findIndex((s) => s.type === "footer");
    const pricing = {
      type: "pricing" as const,
      headline: "Simple pricing",
      subheadline: "Pick a plan that matches your pace.",
      plans: [
        {
          name: "Starter",
          price: "$29",
          period: "/mo",
          features: ["Core pages", "Email support"],
          cta: { label: "Start", href: "#contact" },
        },
        {
          name: "Pro",
          price: "$79",
          period: "/mo",
          features: ["Everything in Starter", "Priority edits", "Analytics"],
          cta: { label: "Go Pro", href: "#contact" },
          highlighted: true,
        },
      ],
    };
    if (footerIdx >= 0) home.sections.splice(footerIdx, 0, pricing);
    else home.sections.push(pricing);
  }

  return {
    ...site,
    theme: { ...theme, radius: theme.radius || "medium" },
    pages: [home, ...site.pages.slice(1)],
  };
}

export function generateWebsiteData(
  prompt: string,
  instruction?: string,
): Website {
  const picked = pickTheme(`${prompt} ${instruction || ""}`);
  const brand = extractBrand(prompt);
  const p = prompt.toLowerCase();

  let headline = `Built for ${brand}`;
  let support = `A focused presence for ${prompt.replace(/\s+/g, " ").trim().slice(0, 80)}.`;
  let cta = "Get started";

  if (/shop|store|boutique|buy|product/.test(p)) {
    headline = `Discover ${brand}`;
    support = "Curated pieces, clear stories, and an easy path from browse to buy.";
    cta = "Shop the collection";
  } else if (/restaurant|cafe|food|menu|dining/.test(p)) {
    headline = `Taste what ${brand} is about`;
    support = "Seasonal plates, warm rooms, and reservations that feel effortless.";
    cta = "Reserve a table";
  } else if (/fitness|gym|yoga|train/.test(p)) {
    headline = `Train with ${brand}`;
    support = "Programs that respect your pace — clear coaching, real results.";
    cta = "Book a session";
  } else if (/saas|app|software|tech|ai/.test(p)) {
    headline = `${brand} makes the hard part quiet`;
    support = "Ship faster with a product story that feels concrete, not buzzwordy.";
    cta = "Try it free";
  } else if (/salon|spa|beauty|wellness/.test(p)) {
    headline = `Quiet luxury at ${brand}`;
    support = "Thoughtful rituals, skilled hands, and a space you want to return to.";
    cta = "Book now";
  }

  const isShop = /shop|store|boutique|product|retail/.test(p);

  const homeSections: Website["pages"][0]["sections"] = [
    {
      type: "nav",
      brand,
      links: [
        { label: "About", href: "#about" },
        { label: isShop ? "Shop" : "Features", href: isShop ? "#products" : "#features" },
        { label: "Contact", href: "#contact" },
      ],
      cta: { label: cta, href: "#contact" },
    },
    {
      type: "hero",
      brand,
      headline,
      subheadline: support,
      primaryCta: { label: cta, href: "#contact" },
      secondaryCta: {
        label: isShop ? "Browse collection" : "See how it works",
        href: isShop ? "#products" : "#features",
      },
      imageUrl: picked.image,
      layout: "fullscreen",
    },
    {
      type: "about",
      headline: `A site shaped around ${brand}`,
      body: instruction
        ? `Demo mode applied: “${instruction.slice(0, 120)}”. Add a real OpenRouter/OpenAI/Gemini key for deeper AI edits.`
        : `${brand} pairs a clear offer with confident visuals — visitors know what you do in seconds.`,
      imageUrl: picked.image,
      stats: [
        { label: "Focus", value: "Clarity" },
        { label: "Craft", value: "Detail" },
        { label: "Pace", value: "Fast" },
      ],
    },
  ];

  if (isShop) {
    homeSections.push({
      type: "products",
      headline: "Featured pieces",
      subheadline: "A short edit of what people ask for first.",
      items: [
        {
          name: "Signature pick",
          description: "The piece that defines the brand story.",
          price: "$48",
          imageUrl: picked.image,
          href: "#contact",
        },
        {
          name: "Everyday favorite",
          description: "Approachable, useful, easy to recommend.",
          price: "$32",
          imageUrl: picked.image,
          href: "#contact",
        },
        {
          name: "Gift set",
          description: "Bundled for people who already love the brand.",
          price: "$86",
          imageUrl: picked.image,
          href: "#contact",
        },
      ],
    });
  } else {
    homeSections.push({
      type: "features",
      headline: "Designed to convert attention",
      subheadline: "One job per section. Clear hierarchy. Room to grow.",
      items: [
        {
          title: "Why it works",
          body: `${brand} leads with a clear offer so visitors decide quickly.`,
        },
        {
          title: "What you get",
          body: "Navigation, hero, proof, and a closing CTA ready to publish or refine.",
        },
        {
          title: "Next step",
          body: "Ask Magic AI to refine copy, colors, or sections — or publish this draft.",
        },
      ],
    });
  }

  homeSections.push(
    {
      type: "testimonials",
      headline: "Words from people who showed up",
      items: [
        {
          quote: `Felt like ${brand} already knew what we needed.`,
          name: "Avery Chen",
          role: "First-time visitor",
        },
        {
          quote: "Clean, specific, and easy to act on — rare for a first draft site.",
          name: "Jordan Blake",
          role: "Local customer",
        },
      ],
    },
    {
      type: "cta",
      headline: "Ready when you are",
      body: "Publish this draft, or refine colors and copy in the builder.",
      cta: { label: cta, href: "#contact" },
    },
    {
      type: "contact",
      headline: "Say hello",
      body: "Tell us what you're building — we'll help shape the next version.",
      email: "hello@example.com",
      cta: { label: cta, href: `mailto:hello@example.com` },
    },
    {
      type: "footer",
      brand,
      tagline: "Made with Magic AI · Demo mode",
      links: [
        { label: "About", href: "#about" },
        { label: "Contact", href: "#contact" },
      ],
      copyright: `© ${new Date().getFullYear()} ${brand}`,
    },
  );

  const pages: Website["pages"] = [
    { id: "home", name: "Home", path: "/", sections: homeSections },
  ];

  // Optional second page for richer briefs
  if (/about|story|team|multi|pages/.test(p)) {
    pages.push({
      id: "about",
      name: "About",
      path: "/about",
      sections: [
        {
          type: "nav",
          brand,
          links: [
            { label: "Home", href: "#page-home" },
            { label: "About", href: "#page-about" },
          ],
          cta: { label: cta, href: "#page-home" },
        },
        {
          type: "about",
          headline: `The story behind ${brand}`,
          body: `${brand} started with a simple idea: make the offer obvious and the experience feel intentional.`,
          imageUrl: picked.image,
        },
        {
          type: "faq",
          headline: "Common questions",
          items: [
            {
              question: "Is this a real published site?",
              answer: "It's a schema-driven draft you can refine and publish from Magic AI.",
            },
            {
              question: "Can I change the layout?",
              answer: "Yes — ask the builder chat to add pricing, gallery, or a new page.",
            },
          ],
        },
        {
          type: "footer",
          brand,
          copyright: `© ${new Date().getFullYear()} ${brand}`,
        },
      ],
    });
  }

  const site: Website = {
    brand,
    theme: {
      primary: picked.primary,
      accent: picked.accent,
      surface: picked.surface,
      surfaceAlt: picked.surfaceAlt,
      text: picked.text,
      muted: picked.muted,
      displayFont: picked.displayFont,
      bodyFont: picked.bodyFont,
      radius: "medium",
    },
    pages,
  };

  return applyInstructionTweaks(site, instruction);
}

/** @deprecated Prefer generateWebsiteData + renderWebsiteToHtml */
export function generateWithDemo(prompt: string, instruction?: string): string {
  return JSON.stringify(generateWebsiteData(prompt, instruction));
}

export function refineWithDemo(input: {
  currentHtml?: string;
  currentData?: Website | null;
  instruction: string;
  originalPrompt?: string;
}): Website {
  if (input.currentData) {
    return applyInstructionTweaks(
      structuredClone(input.currentData),
      input.instruction,
    );
  }
  const seed =
    input.originalPrompt ||
    "A polished local business website";
  return generateWebsiteData(seed, input.instruction);
}
