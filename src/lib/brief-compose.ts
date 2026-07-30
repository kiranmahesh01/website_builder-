export type BriefFields = {
  businessName: string;
  whatYouDo: string;
  city: string;
  vibe: string;
};

export const BRIEF_EXAMPLE_CHIP =
  "Petal & Stem orchid boutique in Brooklyn — warm editorial, green accents";

export function composeBrief(fields: BriefFields): string {
  const name = fields.businessName.trim();
  const offer = fields.whatYouDo.trim();
  const city = fields.city.trim();
  const vibe = fields.vibe.trim();

  const parts: string[] = [];
  if (name) parts.push(name);
  if (offer) {
    parts.push(offer);
  } else if (name) {
    parts.push("local business");
  }
  if (city) parts.push(`in ${city}`);
  if (vibe) parts.push(`— ${vibe}`);

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function parseBriefChip(chip: string): BriefFields {
  const dash = chip.split("—");
  const vibe = dash.slice(1).join("—").trim();
  const left = dash[0]?.trim() || chip;

  const inMatch = left.match(/\bin\s+([A-Za-z\s.'-]+)$/i);
  const city = inMatch?.[1]?.trim() || "";

  let beforeCity = inMatch ? left.slice(0, inMatch.index).trim() : left;
  const nameMatch = beforeCity.match(
    /^(.+?)\s+(boutique|studio|shop|cafe|gym|agency|law|legal|bakery|roastery|portfolio|startup|app|salon|clinic|restaurant)\b/i,
  );

  if (nameMatch) {
    return {
      businessName: nameMatch[1].trim(),
      whatYouDo: nameMatch[2].trim(),
      city,
      vibe,
    };
  }

  const words = beforeCity.split(/\s+/);
  return {
    businessName: words.slice(0, 2).join(" ") || beforeCity,
    whatYouDo: words.slice(2).join(" ") || "local business",
    city,
    vibe,
  };
}
