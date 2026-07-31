import { WEBSITE_DNA_RECORDS } from "./records";
import type { DnaMatch, WebsiteDna } from "./types";

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s/+-]/g, " ");
}

/**
 * Match a brief / industry label to the best Website DNA record.
 * Deterministic keyword scoring — no embeddings.
 */
export function matchWebsiteDna(
  brief: string,
  industryHint?: string,
): DnaMatch {
  const hay = normalize(`${industryHint || ""}\n${brief}`);
  let best: DnaMatch = {
    dna: WEBSITE_DNA_RECORDS[0]!,
    score: 0,
    matchedAliases: [],
    confidence: "low",
  };

  for (const dna of WEBSITE_DNA_RECORDS) {
    const matched: string[] = [];
    let score = 0;
    for (const alias of dna.aliases) {
      if (hay.includes(alias)) {
        matched.push(alias);
        score += alias.length >= 6 ? 4 : 3;
      }
    }
    if (industryHint && normalize(industryHint).includes(normalize(dna.industry))) {
      score += 8;
      if (!matched.includes(dna.industry.toLowerCase())) {
        matched.push(dna.industry.toLowerCase());
      }
    }
    // Soft boost from psychology / pattern words appearing in brief.
    for (const word of [
      ...dna.psychology.desires,
      ...dna.ctas.primary.map((c) => c.split(" ")[0] || ""),
    ]) {
      const w = normalize(word);
      if (w.length >= 4 && hay.includes(w)) score += 1;
    }
    if (score > best.score) {
      best = {
        dna,
        score,
        matchedAliases: matched,
        confidence: score >= 8 ? "high" : score >= 3 ? "medium" : "low",
      };
    }
  }

  // Fallback: generic business DNA = coffee only if score 0 — prefer portfolio for "portfolio"
  if (best.score === 0) {
    const general = WEBSITE_DNA_RECORDS.find((d) => d.id === "portfolio")!;
    return {
      dna: general,
      score: 0,
      matchedAliases: [],
      confidence: "low",
    };
  }

  return best;
}

export function listWebsiteDna(): WebsiteDna[] {
  return WEBSITE_DNA_RECORDS;
}
