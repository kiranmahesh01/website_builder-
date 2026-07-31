/**
 * Personal AI Developer Memory — preferred styles/themes/fonts.
 * Persists on User.preferences JSON when available; also session-local merge.
 */

export type UserPreferenceData = {
  preferredStyles: string[];
  preferredThemes: string[];
  preferredFonts: string[];
  /** Correction learning v1 — append refine change summaries. */
  corrections: { at: string; note: string }[];
  updatedAt?: string;
};

export const EMPTY_PREFERENCES: UserPreferenceData = {
  preferredStyles: [],
  preferredThemes: [],
  preferredFonts: [],
  corrections: [],
};

export function parseUserPreferences(raw: string | null | undefined): UserPreferenceData {
  if (!raw) return { ...EMPTY_PREFERENCES };
  try {
    const parsed = JSON.parse(raw) as Partial<UserPreferenceData>;
    return {
      preferredStyles: parsed.preferredStyles || [],
      preferredThemes: parsed.preferredThemes || [],
      preferredFonts: parsed.preferredFonts || [],
      corrections: parsed.corrections || [],
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return { ...EMPTY_PREFERENCES };
  }
}

export function serializeUserPreferences(data: UserPreferenceData): string {
  return JSON.stringify({
    ...data,
    corrections: data.corrections.slice(0, 40),
    preferredStyles: data.preferredStyles.slice(0, 12),
    preferredThemes: data.preferredThemes.slice(0, 12),
    preferredFonts: data.preferredFonts.slice(0, 12),
    updatedAt: new Date().toISOString(),
  });
}

/** Learn from a refine request — correction learning v1. */
export function appendCorrection(
  prefs: UserPreferenceData,
  request: string,
): UserPreferenceData {
  const note = request.trim().slice(0, 240);
  if (!note) return prefs;
  const next = { ...prefs, corrections: [...prefs.corrections] };
  next.corrections.unshift({ at: new Date().toISOString(), note });
  next.corrections = next.corrections.slice(0, 40);

  const lower = note.toLowerCase();
  if (/minimal|luxury|bold|modern|corporate/.test(lower)) {
    const hit = lower.match(/minimal|luxury|bold|modern|corporate/)?.[0];
    if (hit && !next.preferredStyles.includes(hit)) {
      next.preferredStyles = [hit, ...next.preferredStyles].slice(0, 12);
    }
  }
  if (/playfair|manrope|archivo|space grotesk|dm sans|instrument/i.test(note)) {
    const font = note.match(
      /Playfair Display|Manrope|Archivo|Space Grotesk|DM Sans|Instrument Serif|Inter/i,
    )?.[0];
    if (font && !next.preferredFonts.includes(font)) {
      next.preferredFonts = [font, ...next.preferredFonts].slice(0, 12);
    }
  }
  if (/warm_editorial|bold_startup|minimal_studio/.test(lower)) {
    const theme = lower.match(/warm_editorial|bold_startup|minimal_studio/)?.[0];
    if (theme && !next.preferredThemes.includes(theme)) {
      next.preferredThemes = [theme, ...next.preferredThemes].slice(0, 12);
    }
  }
  return next;
}

/** Inject into planner/designer prompts. */
export function preferencePromptBlock(prefs: UserPreferenceData): string {
  if (
    !prefs.preferredStyles.length &&
    !prefs.preferredThemes.length &&
    !prefs.preferredFonts.length &&
    !prefs.corrections.length
  ) {
    return "";
  }
  const lines = ["User preference memory (Personal AI Developer):"];
  if (prefs.preferredStyles.length) {
    lines.push(`Preferred styles: ${prefs.preferredStyles.join(", ")}`);
  }
  if (prefs.preferredThemes.length) {
    lines.push(`Preferred themes: ${prefs.preferredThemes.join(", ")}`);
  }
  if (prefs.preferredFonts.length) {
    lines.push(`Preferred fonts: ${prefs.preferredFonts.join(", ")}`);
  }
  if (prefs.corrections.length) {
    lines.push(
      `Recent corrections: ${prefs.corrections
        .slice(0, 5)
        .map((c) => c.note)
        .join(" | ")}`,
    );
  }
  return lines.join("\n");
}
