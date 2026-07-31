import { matchWebsiteDna } from "@/lib/dna";
import { expandPromptToExpertBrief } from "@/lib/prompt";

export type DoctorIssue = {
  severity: "critical" | "warning" | "info";
  area: string;
  message: string;
  fix: string;
};

export type DoctorScores = {
  overall: number;
  seo: number;
  content: number;
  conversion: number;
  trust: number;
  structure: number;
};

export type DoctorAudit = {
  url?: string;
  title?: string;
  headings: string[];
  links: { href: string; text: string }[];
  scores: DoctorScores;
  problems: DoctorIssue[];
  summary: string;
  /** Seed for creating a Magic project / blueprint. */
  fixBrief: string;
  industryGuess: string;
};

const FETCH_TIMEOUT_MS = 8000;

/**
 * AI Website Doctor — fetch URL HTML (timeout) and/or use screenshot hints
 * to produce health scores + fix brief. No heavy browser automation.
 */
export async function auditWebsite(input: {
  url?: string;
  htmlHint?: string;
  screenshotSummary?: string;
}): Promise<DoctorAudit> {
  let html = input.htmlHint || "";
  let finalUrl = input.url?.trim();

  if (finalUrl && !html) {
    html = await fetchHtml(finalUrl);
  }

  const title = extractTag(html, "title") || undefined;
  const headings = [
    ...extractAll(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi),
    ...extractAll(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi),
  ]
    .map(stripTags)
    .filter(Boolean)
    .slice(0, 12);

  const links = extractLinks(html).slice(0, 20);
  const textBlob = stripTags(html).slice(0, 4000);
  const dna = matchWebsiteDna(
    [title, headings.join(" "), input.screenshotSummary, textBlob]
      .filter(Boolean)
      .join("\n"),
  );

  const problems: DoctorIssue[] = [];
  let seo = 50;
  let content = 50;
  let conversion = 45;
  let trust = 50;
  let structure = 50;

  if (title && title.length >= 10 && title.length <= 65) seo += 20;
  else
    problems.push({
      severity: "critical",
      area: "SEO",
      message: title ? "Title length is weak for SERP." : "Missing <title>.",
      fix: "Write a clear 30–60 character title with brand + offer.",
    });

  const metaDesc = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i,
  )?.[1];
  if (metaDesc && metaDesc.length >= 50) seo += 15;
  else
    problems.push({
      severity: "warning",
      area: "SEO",
      message: "Missing or short meta description.",
      fix: "Add a benefit-led description under 160 characters.",
    });

  if (headings.length === 0) {
    structure -= 20;
    problems.push({
      severity: "critical",
      area: "Structure",
      message: "No H1/H2 headings detected.",
      fix: "Add one H1 and clear section H2s.",
    });
  } else {
    structure += 15;
    content += 10;
  }

  const h1Count = (html.match(/<h1\b/gi) || []).length;
  if (h1Count === 1) {
    structure += 10;
    content += 5;
  } else if (h1Count === 0) {
    problems.push({
      severity: "critical",
      area: "Accessibility",
      message: "No H1 found.",
      fix: "Use a single descriptive H1 matching the offer.",
    });
  }

  const ctaWords =
    /book|buy|shop|demo|trial|contact|get started|order|reserve|subscribe/i;
  if (ctaWords.test(textBlob) || links.some((l) => ctaWords.test(l.text))) {
    conversion += 25;
  } else {
    problems.push({
      severity: "critical",
      area: "Conversion",
      message: "No clear conversion CTA language found.",
      fix: `Add a primary CTA like “${dna.dna.ctas.primary[0]}”.`,
    });
  }

  if (/testimonial|review|trusted|client/i.test(textBlob)) trust += 20;
  else
    problems.push({
      severity: "warning",
      area: "Trust",
      message: "Little social proof detected.",
      fix: "Add a testimonial or review snippet near the CTA.",
    });

  if (links.length < 3) {
    structure -= 10;
    problems.push({
      severity: "info",
      area: "Structure",
      message: "Few internal/external links detected.",
      fix: "Add nav links to key pages (about, offer, contact).",
    });
  } else structure += 10;

  if (input.screenshotSummary) {
    content += 5;
    problems.push({
      severity: "info",
      area: "Visual",
      message: `Screenshot notes: ${input.screenshotSummary.slice(0, 160)}`,
      fix: "Use Magic Blueprint design system to replace weak visual hierarchy.",
    });
  }

  seo = clamp(seo);
  content = clamp(content);
  conversion = clamp(conversion);
  trust = clamp(trust);
  structure = clamp(structure);
  const overall = Math.round(
    seo * 0.2 + content * 0.2 + conversion * 0.25 + trust * 0.15 + structure * 0.2,
  );

  const idea = [
    finalUrl ? `Audit of ${finalUrl}` : "Site audit from screenshot/HTML",
    title ? `Current title: ${title}` : null,
    `Industry guess: ${dna.dna.industry}`,
    `Problems: ${problems
      .filter((p) => p.severity !== "info")
      .map((p) => p.message)
      .join("; ")}`,
    input.screenshotSummary
      ? `Visual: ${input.screenshotSummary.slice(0, 200)}`
      : null,
  ]
    .filter(Boolean)
    .join(". ");

  const expanded = expandPromptToExpertBrief({
    idea,
    industryHint: dna.dna.industry,
    goal: dna.dna.ctas.primary[0],
    dna: dna.dna,
  });

  return {
    url: finalUrl,
    title,
    headings,
    links,
    scores: { overall, seo, content, conversion, trust, structure },
    problems,
    summary: `Health ${overall}/100 — ${problems.filter((p) => p.severity === "critical").length} critical issues. Matched ${dna.dna.industry} DNA.`,
    fixBrief: expanded.expandedBrief,
    industryGuess: dna.dna.industry,
  };
}

async function fetchHtml(url: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http(s) URLs are supported");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "MagicAI-WebsiteDoctor/1.0",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    const text = await res.text();
    return text.slice(0, 400_000);
  } finally {
    clearTimeout(timer);
  }
}

function extractTag(html: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  return stripTags(html.match(re)?.[1] || "");
}

function extractAll(html: string, re: RegExp): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const r = new RegExp(re.source, re.flags);
  while ((m = r.exec(html))) {
    out.push(m[1] || "");
    if (out.length > 30) break;
  }
  return out;
}

function extractLinks(html: string): { href: string; text: string }[] {
  const out: { href: string; text: string }[] = [];
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    out.push({ href: m[1] || "", text: stripTags(m[2] || "").slice(0, 80) });
    if (out.length > 40) break;
  }
  return out;
}

function stripTags(s: string): string {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
