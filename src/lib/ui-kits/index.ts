export const UI_KITS = [
  "daisyui",
  "flowbite",
  "preline",
  "shadcn",
  "magic",
] as const;

export type UiKit = (typeof UI_KITS)[number];

export const UI_KIT_LABELS: Record<UiKit, string> = {
  daisyui: "DaisyUI — colorful components",
  flowbite: "Flowbite — marketing blocks",
  preline: "Preline — polished landing",
  shadcn: "shadcn — clean structure",
  magic: "Magic — custom inline",
};

export const DEFAULT_UI_KIT: UiKit = "daisyui";

export function normalizeUiKit(value?: string | null): UiKit {
  if (value && UI_KITS.includes(value as UiKit)) return value as UiKit;
  return DEFAULT_UI_KIT;
}

/** Pick a kit from brief tone / business type. */
export function pickUiKitFromBrief(prompt: string): UiKit {
  const p = prompt.toLowerCase();
  if (/minimal|clean|saas|app|dashboard|professional|corporate/.test(p)) {
    return "shadcn";
  }
  if (/marketing|landing|startup|agency|bold/.test(p)) return "preline";
  if (/shop|store|ecommerce|boutique|colorful|playful/.test(p)) {
    return "daisyui";
  }
  if (/blog|docs|content|newsletter/.test(p)) return "flowbite";
  return "daisyui";
}
