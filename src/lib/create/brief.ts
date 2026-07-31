/**
 * Structured create-wizard brief — Wegic-style fields composed into a rich
 * multi-line prompt the planner / designer / generate path can parse.
 */

export const WEBSITE_TYPES = [
  { id: "business", label: "Business", blurb: "Local or service brand" },
  { id: "portfolio", label: "Portfolio", blurb: "Showcase work & case studies" },
  { id: "store", label: "Store", blurb: "Products with checkout CTAs" },
  { id: "blog", label: "Blog", blurb: "Articles and content hub" },
  { id: "landing", label: "Landing page", blurb: "Single-page conversion" },
] as const;

export type WebsiteTypeId = (typeof WEBSITE_TYPES)[number]["id"];

export const INDUSTRIES = [
  "Coffee",
  "Restaurant",
  "Real estate",
  "Fitness",
  "SaaS",
  "Hotel",
  "Portfolio",
  "Ecommerce",
] as const;

export const STYLES = [
  { id: "minimal", label: "Minimal", blurb: "Clean space, quiet type" },
  { id: "luxury", label: "Luxury", blurb: "Premium materials, restraint" },
  { id: "modern", label: "Modern", blurb: "Sharp, current, product-led" },
  { id: "bold", label: "Bold", blurb: "High contrast, strong motion" },
  { id: "corporate", label: "Corporate", blurb: "Trust, clarity, B2B" },
] as const;

export type StyleId = (typeof STYLES)[number]["id"];

export type CreateWizardAnswers = {
  websiteType: WebsiteTypeId;
  industry: string;
  industryCustom: string;
  style: StyleId;
  businessName: string;
  goal: string;
  targetCustomers: string;
  brandFeeling: string;
  colors: string;
  extraDetails: string;
};

export const EMPTY_CREATE_ANSWERS: CreateWizardAnswers = {
  websiteType: "business",
  industry: "Coffee",
  industryCustom: "",
  style: "minimal",
  businessName: "",
  goal: "",
  targetCustomers: "",
  brandFeeling: "",
  colors: "",
  extraDetails: "",
};

const SECTIONS_BY_TYPE: Record<WebsiteTypeId, string[]> = {
  business: ["Hero", "About", "Services / features", "Testimonials", "Contact"],
  portfolio: ["Hero", "Featured work", "About", "Process", "Contact"],
  store: ["Hero", "Featured products", "Benefits", "Checkout CTA", "FAQ", "Contact"],
  blog: ["Hero", "Featured posts", "Topics", "About", "Newsletter", "Footer"],
  landing: ["Hero", "Benefits", "Social proof", "Pricing or offer", "Final CTA"],
};

const FEATURES_BY_TYPE: Record<WebsiteTypeId, string[]> = {
  business: ["Lead capture form", "Location & hours", "Clear primary CTA"],
  portfolio: ["Case study grid", "Project detail CTAs", "Contact form"],
  store: ["Product highlights", "Add-to-cart / checkout CTAs", "Shipping FAQ"],
  blog: ["Post cards", "Category navigation", "Email signup"],
  landing: ["Single conversion CTA", "Benefit bullets", "Trust logos or quotes"],
};

const PAGES_BY_TYPE: Record<WebsiteTypeId, string[]> = {
  business: ["Home"],
  portfolio: ["Home", "Work"],
  store: ["Home", "Shop"],
  blog: ["Home", "Blog"],
  landing: ["Home"],
};

export function resolveIndustry(answers: CreateWizardAnswers): string {
  const custom = answers.industryCustom.trim();
  if (custom) return custom;
  return answers.industry.trim() || "General";
}

export function styleLabel(style: StyleId): string {
  return STYLES.find((s) => s.id === style)?.label || style;
}

export function websiteTypeLabel(type: WebsiteTypeId): string {
  return WEBSITE_TYPES.find((t) => t.id === type)?.label || type;
}

export function suggestedPages(type: WebsiteTypeId): string[] {
  return [...PAGES_BY_TYPE[type]];
}

export function suggestedSections(
  type: WebsiteTypeId,
  industry: string,
): string[] {
  const base = [...SECTIONS_BY_TYPE[type]];
  const lower = industry.toLowerCase();
  if (/coffee|cafe|restaurant|bakery|food/.test(lower) && !base.includes("Menu")) {
    base.splice(2, 0, "Menu");
  }
  if (/fitness|gym|yoga/.test(lower) && !base.includes("Classes / membership")) {
    base.splice(2, 0, "Classes / membership");
  }
  if (/real estate|realtor|property/.test(lower) && !base.includes("Listings")) {
    base.splice(2, 0, "Listings");
  }
  return base;
}

export function suggestedFeatures(type: WebsiteTypeId): string[] {
  return [...FEATURES_BY_TYPE[type]];
}

/**
 * Compose a rich structured brief matching the Wegic-style coffee example shape.
 */
export function composeStructuredBrief(answers: CreateWizardAnswers): string {
  const industry = resolveIndustry(answers);
  const typeLabel = websiteTypeLabel(answers.websiteType);
  const style = styleLabel(answers.style);
  const business =
    answers.businessName.trim() ||
    `${industry} ${typeLabel === "Landing page" ? "brand" : typeLabel.toLowerCase()}`;
  const goal =
    answers.goal.trim() ||
    defaultGoal(answers.websiteType, industry);
  const target =
    answers.targetCustomers.trim() ||
    defaultTarget(industry);
  const feeling =
    answers.brandFeeling.trim() ||
    defaultFeeling(answers.style, industry);
  const colors = answers.colors.trim() || defaultColors(answers.style, industry);
  const sections = suggestedSections(answers.websiteType, industry);
  const features = suggestedFeatures(answers.websiteType);
  const images = defaultImages(industry);

  const lines = [
    `Business: ${business}`,
    `Goal: ${goal}`,
    `Target: ${target}`,
    `Website type: ${typeLabel}`,
    `Industry: ${industry}`,
    `Style: ${style}`,
    `Brand feeling: ${feeling}`,
    `Required sections: ${sections.join(", ")}`,
    `Features: ${features.join(", ")}`,
    `Colors: ${colors}`,
    `Images: ${images}`,
  ];

  if (answers.extraDetails.trim()) {
    lines.push(`Extra details: ${answers.extraDetails.trim()}`);
  }

  return lines.join("\n");
}

function defaultGoal(type: WebsiteTypeId, industry: string): string {
  switch (type) {
    case "store":
      return `Sell ${industry.toLowerCase()} products online and drive checkout`;
    case "portfolio":
      return `Showcase ${industry.toLowerCase()} work and win new clients`;
    case "blog":
      return `Publish ${industry.toLowerCase()} content and grow an audience`;
    case "landing":
      return `Convert visitors for a ${industry.toLowerCase()} offer`;
    default:
      return `Attract customers and explain what the ${industry.toLowerCase()} business offers`;
  }
}

function defaultTarget(industry: string): string {
  const lower = industry.toLowerCase();
  if (/coffee|cafe/.test(lower)) return "Local coffee lovers, remote workers, and weekend visitors";
  if (/restaurant|food/.test(lower)) return "Diners looking for a memorable meal nearby";
  if (/real estate/.test(lower)) return "Home buyers and sellers in the local market";
  if (/fitness|gym/.test(lower)) return "People seeking training, classes, or memberships";
  if (/saas|software/.test(lower)) return "Teams evaluating a product for work";
  return `People searching for ${industry.toLowerCase()} services`;
}

function defaultFeeling(style: StyleId, industry: string): string {
  const byStyle: Record<StyleId, string> = {
    minimal: "Calm, uncluttered, confident",
    luxury: "Refined, exclusive, tactile",
    modern: "Crisp, current, product-forward",
    bold: "Energetic, expressive, high-impact",
    corporate: "Trustworthy, clear, professional",
  };
  if (/coffee|cafe/.test(industry.toLowerCase()) && style === "minimal") {
    return "Warm, artisan, neighborhood — inviting without clutter";
  }
  return byStyle[style];
}

function defaultColors(style: StyleId, industry: string): string {
  if (/coffee|cafe/.test(industry.toLowerCase())) {
    return "Warm espresso browns, cream, soft charcoal";
  }
  switch (style) {
    case "luxury":
      return "Deep charcoal, ivory, muted gold accent";
    case "bold":
      return "High-contrast ink and a vivid accent from the brand";
    case "corporate":
      return "Navy, cool gray, restrained accent";
    case "modern":
      return "Neutral base with one sharp accent";
    default:
      return "Soft neutrals with one grounded accent";
  }
}

function defaultImages(industry: string): string {
  const lower = industry.toLowerCase();
  if (/coffee|cafe/.test(lower)) {
    return "Coffee bar atmosphere, pour-over detail, cozy seating";
  }
  if (/restaurant/.test(lower)) {
    return "Plated dishes, dining room, chef or ingredients";
  }
  if (/real estate/.test(lower)) {
    return "Property exteriors, bright interiors, neighborhood context";
  }
  if (/fitness/.test(lower)) {
    return "Training moments, studio space, community energy";
  }
  if (/saas/.test(lower)) {
    return "Product UI, team collaboration, abstract product texture";
  }
  return `Authentic ${industry.toLowerCase()} atmosphere and people`;
}

/** Seed wizard answers from a free-text hero prompt when present. */
export function seedAnswersFromPrompt(prompt: string): Partial<CreateWizardAnswers> {
  const value = prompt.trim();
  if (!value) return {};
  const lower = value.toLowerCase();
  const patch: Partial<CreateWizardAnswers> = {
    extraDetails: value,
  };

  if (/portfolio|illustrat|photographer|designer|case stud/.test(lower)) {
    patch.websiteType = "portfolio";
  } else if (/shop|store|ecommerce|product|buy/.test(lower)) {
    patch.websiteType = "store";
  } else if (/blog|newsletter|magazine/.test(lower)) {
    patch.websiteType = "blog";
  } else if (/landing|waitlist|saas|startup|pricing/.test(lower)) {
    patch.websiteType = "landing";
  }

  for (const industry of INDUSTRIES) {
    if (lower.includes(industry.toLowerCase())) {
      patch.industry = industry;
      break;
    }
  }
  if (/cafe|espresso|roaster/.test(lower)) patch.industry = "Coffee";
  if (/yoga|gym|crossfit/.test(lower)) patch.industry = "Fitness";
  if (/realtor|property|homes? for sale/.test(lower)) patch.industry = "Real estate";

  if (/minimal|clean/.test(lower)) patch.style = "minimal";
  else if (/luxury|premium|elegant/.test(lower)) patch.style = "luxury";
  else if (/bold|vibrant|loud/.test(lower)) patch.style = "bold";
  else if (/corporate|professional|b2b/.test(lower)) patch.style = "corporate";
  else if (/modern/.test(lower)) patch.style = "modern";

  return patch;
}
