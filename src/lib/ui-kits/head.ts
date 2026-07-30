import type { Theme } from "@/lib/schema";
import type { UiKit } from "./index";

function themeCss(theme: Theme): string {
  const radius =
    theme.radius === "none"
      ? "0"
      : theme.radius === "small"
        ? "0.25rem"
        : theme.radius === "large"
          ? "1rem"
          : "0.5rem";

  return `:root {
  --primary: ${theme.primary};
  --accent: ${theme.accent};
  --surface: ${theme.surface};
  --surface-alt: ${theme.surfaceAlt || theme.surface};
  --text: ${theme.text};
  --muted: ${theme.muted};
  --radius: ${radius};
  --background: ${theme.surface};
  --foreground: ${theme.text};
  --primary-foreground: #111;
  --muted-foreground: ${theme.muted};
  --border: color-mix(in srgb, ${theme.text} 14%, transparent);
  --card: ${theme.surfaceAlt || theme.surface};
  --card-foreground: ${theme.text};
}
body { background: var(--surface); color: var(--text); font-family: "${theme.bodyFont}", system-ui, sans-serif; }
.kit-display { font-family: "${theme.displayFont}", Georgia, serif; }
.kit-accent { background-color: var(--accent) !important; border-color: var(--accent) !important; color: #111 !important; }
.kit-surface { background-color: var(--surface); color: var(--text); }
.kit-surface-alt { background-color: var(--surface-alt); }
.kit-muted { color: var(--muted); }`;
}

const TAILWIND_CDN = `<script src="https://cdn.tailwindcss.com"></script>`;

export function uiKitHeadAssets(kit: UiKit, theme: Theme): string {
  const css = themeCss(theme);
  const base = `<style>${css}</style>`;

  switch (kit) {
    case "daisyui":
      return `${base}
<link href="https://cdn.jsdelivr.net/npm/daisyui@5/dist/full.css" rel="stylesheet" />
${TAILWIND_CDN}
<script>document.documentElement.setAttribute("data-theme","light");</script>`;
    case "flowbite":
      return `${base}
<link href="https://cdn.jsdelivr.net/npm/flowbite@3/dist/flowbite.min.css" rel="stylesheet" />
${TAILWIND_CDN}
<script src="https://cdn.jsdelivr.net/npm/flowbite@3/dist/flowbite.min.js" defer></script>`;
    case "preline":
      return `${base}
${TAILWIND_CDN}
<link rel="stylesheet" href="https://preline.co/assets/css/main.min.css" />
<script src="https://preline.co/assets/js/hs-ui.bundle.js" defer></script>`;
    case "shadcn":
      return `${base}
${TAILWIND_CDN}
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: { DEFAULT: 'var(--accent)', foreground: 'var(--primary-foreground)' },
        muted: { DEFAULT: 'var(--card)', foreground: 'var(--muted-foreground)' },
        border: 'var(--border)',
        card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
    },
  },
};
</script>`;
    default:
      return base;
  }
}
