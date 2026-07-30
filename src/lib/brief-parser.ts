import { DEFAULT_UI_KIT } from "@/lib/ui-kits";

export type ParsedBrief = {
  raw: string;
  brandHint: string | null;
  location: string | null;
  exactPhrases: string[];
  keywords: string[];
  requestedSections: string[];
  styleHints: string[];
  tone: string | null;
  audience: string | null;
};

const STOP = new Set([
  "a", "an", "the", "for", "with", "and", "or", "of", "to", "in", "on", "at", "by",
  "my", "our", "your", "website", "site", "landing", "page", "build", "create",
  "make", "design", "need", "want", "like", "using", "include", "add", "show",
  "modern", "beautiful", "simple", "best", "good", "nice", "new", "online",
]);

const GENERIC_BANNED = [
  "welcome to our website",
  "welcome to",
  "your trusted partner",
  "cutting-edge solutions",
  "innovative solutions",
  "we are passionate",
  "leading provider",
  "world-class",
  "unlock your potential",
  "transform your business",
  "seamless experience",
  "take your business to the next level",
  "designed to convert attention",
  "ready when you are",
  "say hello",
  "get started today",
  "learn more about us",
];

export function parseBrief(prompt: string): ParsedBrief {
  const raw = prompt.trim();
  const lower = raw.toLowerCase();

  const exactPhrases: string[] = [];
  for (const m of raw.matchAll(/["']([^"']{2,80})["']/g)) {
    exactPhrases.push(m[1].trim());
  }

  const brandMatch = raw.match(
    /(?:called|named|brand(?:ed)?|for|business)\s+["']?([A-Za-z0-9][A-Za-z0-9 &'-]{1,48})["']?/i,
  );
  const brandHint = brandMatch?.[1]?.trim() || null;

  const locationMatch = raw.match(
    /\b(?:in|near|based in|located in|from)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})/,
  );
  const location = locationMatch?.[1]?.trim() || null;

  const keywords = [
    ...new Set(
      raw
        .replace(/[^a-zA-Z0-9\s'-]/g, " ")
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 2 && !STOP.has(w.toLowerCase()))
        .slice(0, 24),
    ),
  ];

  const requestedSections: string[] = [];
  if (/menu|food|dish|restaurant|cafe|coffee|bakery/.test(lower)) {
    requestedSections.push("products or features with menu items");
  }
  if (/shop|store|boutique|ecommerce|product|buy|cart/.test(lower)) {
    requestedSections.push("products", "checkout");
  }
  if (/book|booking|appointment|reserv|salon|spa|hotel/.test(lower)) {
    requestedSections.push("booking");
  }
  if (/pric|plan|tier|subscription|saas/.test(lower)) {
    requestedSections.push("pricing");
  }
  if (/gallery|photo|portfolio|showcase|work/.test(lower)) {
    requestedSections.push("gallery");
  }
  if (/faq|question/.test(lower)) {
    requestedSections.push("faq");
  }
  if (/testimonial|review|client/.test(lower)) {
    requestedSections.push("testimonials");
  }
  if (/contact|email|phone|map|location|hours/.test(lower)) {
    requestedSections.push("contact");
  }

  const styleHints: string[] = [];
  if (/minimal|clean|simple|white space/.test(lower)) styleHints.push("minimal");
  if (/dark|black|night/.test(lower)) styleHints.push("dark theme");
  if (/light|bright|white background/.test(lower)) styleHints.push("light theme");
  if (/bold|loud|vibrant|colorful/.test(lower)) styleHints.push("bold colors");
  if (/elegant|luxury|premium|upscale/.test(lower)) styleHints.push("elegant");
  if (/playful|fun|quirky/.test(lower)) styleHints.push("playful");
  if (/rustic|warm|cozy|organic/.test(lower)) styleHints.push("warm rustic");
  if (/editorial|magazine|typography/.test(lower)) styleHints.push("editorial typography");
  if (/green|blue|red|gold|orange|pink|purple/.test(lower)) {
    const color = lower.match(/\b(green|blue|red|gold|orange|pink|purple)\b/)?.[1];
    if (color) styleHints.push(`accent color: ${color}`);
  }

  let tone: string | null = null;
  if (/professional|corporate|formal/.test(lower)) tone = "professional";
  else if (/friendly|casual|approachable/.test(lower)) tone = "friendly";
  else if (/luxury|premium|elegant/.test(lower)) tone = "premium";
  else if (/playful|fun/.test(lower)) tone = "playful";

  const audienceMatch = raw.match(
    /(?:for|targeting|aimed at|serving)\s+([^.]{8,60})/i,
  );
  const audience = audienceMatch?.[1]?.trim() || null;

  return {
    raw,
    brandHint,
    location,
    exactPhrases,
    keywords,
    requestedSections,
    styleHints,
    tone,
    audience,
  };
}

export function buildBriefUserMessage(
  brief: ParsedBrief,
  options?: { fast?: boolean },
): string {
  const lines: string[] = [
    "=== CLIENT BRIEF (follow literally — this is the source of truth) ===",
    brief.raw,
    "",
    "=== EXTRACTED REQUIREMENTS (you MUST honor these) ===",
  ];

  if (brief.brandHint) lines.push(`- Brand / business name: "${brief.brandHint}"`);
  if (brief.location) lines.push(`- Location to mention: ${brief.location}`);
  if (brief.tone) lines.push(`- Tone: ${brief.tone}`);
  if (brief.audience) lines.push(`- Audience: ${brief.audience}`);
  if (brief.exactPhrases.length) {
    lines.push(
      `- Use these EXACT phrases somewhere visible (hero, nav, or section headlines): ${brief.exactPhrases.map((p) => `"${p}"`).join(", ")}`,
    );
  }
  if (brief.keywords.length) {
    lines.push(
      `- Weave these specific words from the brief into copy (not all in one sentence): ${brief.keywords.slice(0, 12).join(", ")}`,
    );
  }
  if (brief.requestedSections.length) {
    lines.push(`- Required sections: ${brief.requestedSections.join(", ")}`);
  }
  if (brief.styleHints.length) {
    lines.push(`- Visual direction: ${brief.styleHints.join("; ")}`);
  }
  lines.push(
    `- UI kit: pick one of daisyui (shops/colorful), preline (SaaS/agency), shadcn (minimal/pro), flowbite (content/blog). Default: ${DEFAULT_UI_KIT}.`,
  );

  if (options?.fast) {
    lines.push(
      "- FAST MODE: 1 page only. Sections: nav, hero, ONE content block (features/products/about), contact or cta, footer. Max 6 sections.",
    );
  } else {
    lines.push(
      "- Full site: nav, hero, 3–5 niche-specific sections, contact/cta, footer.",
    );
  }

  lines.push(
    "",
    "=== CHECKLIST BEFORE YOU OUTPUT JSON ===",
    "1) Hero headline reflects the client's offer — use their words, not a generic template.",
    "2) Brand name matches the brief (not 'Studio', 'Brand', or made-up names unless brief is vague).",
    "3) Theme (colors + fonts) fits the niche — do NOT reuse the same dark palette for every site.",
    "4) Vary hero layout: split for visual businesses, centered for SaaS, minimal for portfolios, fullscreen for hospitality.",
    "5) Every section headline is specific to THIS business — no filler.",
    "6) Return ONLY valid JSON.",
  );

  return lines.join("\n");
}

export function siteCopyBlob(site: unknown): string {
  return JSON.stringify(site).toLowerCase();
}

/** 0–100 — how well the site reflects the user's brief. */
export function scoreBriefAdherence(
  site: unknown,
  brief: ParsedBrief,
): number {
  const blob = siteCopyBlob(site);
  let score = 40;

  const mustTerms = [
    ...brief.exactPhrases.map((p) => p.toLowerCase()),
    ...(brief.brandHint ? [brief.brandHint.toLowerCase()] : []),
    ...(brief.location ? [brief.location.toLowerCase()] : []),
    ...brief.keywords.slice(0, 8).map((k) => k.toLowerCase()),
  ].filter((t) => t.length > 2);

  if (mustTerms.length === 0) return 70;

  let hits = 0;
  for (const term of mustTerms) {
    if (blob.includes(term)) hits += 1;
  }
  score += Math.min(40, Math.round((hits / mustTerms.length) * 40));

  for (const banned of GENERIC_BANNED) {
    if (blob.includes(banned)) score -= 12;
  }

  if (brief.brandHint) {
    const brand = brief.brandHint.toLowerCase();
    if (!blob.includes(brand)) score -= 15;
  }

  for (const section of brief.requestedSections) {
    const key = section.split(" ")[0];
    if (blob.includes(key)) score += 4;
  }

  return Math.max(0, Math.min(100, score));
}

export { GENERIC_BANNED };
