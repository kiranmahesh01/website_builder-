/**
 * Expand industry × layout seeds into a countable AI template library.
 * Pure function — the CLI script writes the generated module to disk.
 */

import type { AiTemplate, TemplateCategory, TemplateStyle } from "./types";
import {
  INDUSTRY_SEEDS,
  LAYOUTS_BY_CATEGORY,
  PALETTES,
  STYLE_ORDER,
  copyPatternsFor,
  layoutRulesFor,
  styleLabel,
  titleCase,
} from "./seeds";

export type GenerateStats = {
  total: number;
  byCategory: Record<TemplateCategory, number>;
};

export function generateTemplateLibrary(): {
  templates: AiTemplate[];
  stats: GenerateStats;
} {
  const templates: AiTemplate[] = [];
  const byCategory: Record<TemplateCategory, number> = {
    landing: 0,
    saas: 0,
    restaurant: 0,
    portfolio: 0,
    ecommerce: 0,
  };

  let seq = 0;

  for (const seed of INDUSTRY_SEEDS) {
    const layouts = LAYOUTS_BY_CATEGORY[seed.category];
    for (let li = 0; li < layouts.length; li++) {
      const layout = layouts[li];
      const style: TemplateStyle =
        STYLE_ORDER[(seq + li) % STYLE_ORDER.length] ?? seed.defaultStyle;
      const palette = PALETTES[(seq + li * 3) % PALETTES.length]!;
      // Prefer palettes that match the industry default theme when possible.
      const themed =
        PALETTES.find(
          (p, idx) =>
            p.theme === seed.defaultTheme &&
            idx % Math.max(1, layouts.length) === li % Math.max(1, layouts.length),
        ) ||
        PALETTES.find((p) => p.theme === seed.defaultTheme) ||
        palette;

      const n = String((byCategory[seed.category] % 99) + 1).padStart(2, "0");
      const id = `${seed.industry}-${style}-${layout.id}-${n}`;
      const name = `${styleLabel(style)} ${titleCase(seed.industry)} (${layout.id})`;

      templates.push({
        id,
        name,
        industry: seed.industry,
        category: seed.category,
        style,
        theme: themed.theme,
        sections: [...layout.sections],
        designTokens: { ...themed.tokens },
        copyPatterns: copyPatternsFor(seed.industry, seed.category, style),
        tags: [
          ...seed.keywords,
          seed.category,
          style,
          themed.theme,
          layout.id,
          themed.id,
        ],
        layoutRules: layoutRulesFor(seed.category, layout.id),
      });

      byCategory[seed.category] += 1;
      seq += 1;
    }
  }

  return {
    templates,
    stats: {
      total: templates.length,
      byCategory: { ...byCategory },
    },
  };
}
