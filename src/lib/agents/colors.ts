/**
 * Deterministic colour parsing. Anything the user says that maps cleanly to a
 * hex value here never needs a model call.
 */

const NAMED_COLORS: Record<string, string> = {
  black: "#111111",
  white: "#FFFFFF",
  grey: "#6B7280",
  gray: "#6B7280",
  silver: "#C0C4CC",
  charcoal: "#2F3336",
  slate: "#475569",
  navy: "#1E3A5F",
  blue: "#2563EB",
  sky: "#0EA5E9",
  cyan: "#06B6D4",
  teal: "#0D9488",
  turquoise: "#14B8A6",
  mint: "#6EE7B7",
  green: "#16A34A",
  emerald: "#059669",
  olive: "#6B7A2F",
  lime: "#84CC16",
  yellow: "#EAB308",
  gold: "#D4A017",
  amber: "#F59E0B",
  orange: "#EA580C",
  coral: "#F26B5B",
  red: "#DC2626",
  crimson: "#B91C3C",
  maroon: "#7F1D1D",
  burgundy: "#6B1F35",
  pink: "#EC4899",
  rose: "#F43F5E",
  magenta: "#C026D3",
  purple: "#7C3AED",
  violet: "#8B5CF6",
  indigo: "#4F46E5",
  lavender: "#B9A7E6",
  brown: "#78503C",
  tan: "#C9A87C",
  beige: "#E8DCC8",
  cream: "#F5EFE3",
};

export const COLOR_NAMES = Object.keys(NAMED_COLORS);

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((c) => clamp(c).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (amount >= 0) {
    return rgbToHex(
      r + (255 - r) * amount,
      g + (255 - g) * amount,
      b + (255 - b) * amount,
    );
  }
  const factor = 1 + amount;
  return rgbToHex(r * factor, g * factor, b * factor);
}

export function normalizeHex(value: string): string | null {
  const match = value.trim().match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!match) return null;
  return `#${match[1].toUpperCase()}`;
}

/** Pull the first colour mentioned in a sentence, honouring dark/light modifiers. */
export function extractColor(text: string): string | null {
  const explicit = text.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/);
  if (explicit) return `#${explicit[1].toUpperCase()}`;

  const lower = text.toLowerCase();
  for (const name of COLOR_NAMES) {
    const pattern = new RegExp(
      `\\b(dark|deep|light|pale|bright|soft|muted)?\\s*${name}\\b`,
    );
    const match = lower.match(pattern);
    if (!match) continue;

    const base = NAMED_COLORS[name];
    switch (match[1]) {
      case "dark":
      case "deep":
        return shade(base, -0.3);
      case "light":
      case "pale":
      case "soft":
        return shade(base, 0.35);
      case "muted":
        return shade(base, 0.15);
      case "bright":
        return shade(base, -0.05);
      default:
        return base;
    }
  }
  return null;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

/** Pick black or white text for a given background. */
export function readableTextOn(background: string): string {
  return relativeLuminance(background) > 0.45 ? "#111111" : "#FFFFFF";
}
