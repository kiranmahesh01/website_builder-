import type { AiTemplate } from "../types";
import {
  GENERATED_TEMPLATES,
  GENERATED_TEMPLATE_STATS,
} from "./registry.generated";

let cache: AiTemplate[] | null = null;

export function getTemplateLibrary(): AiTemplate[] {
  if (!cache) cache = GENERATED_TEMPLATES;
  return cache;
}

export function getTemplateById(id: string): AiTemplate | undefined {
  return getTemplateLibrary().find((t) => t.id === id);
}

export function getTemplatesByIndustry(industry: string): AiTemplate[] {
  const key = industry.toLowerCase();
  return getTemplateLibrary().filter((t) => t.industry === key);
}

export function getTemplatesByCategory(
  category: AiTemplate["category"],
): AiTemplate[] {
  return getTemplateLibrary().filter((t) => t.category === category);
}

export { GENERATED_TEMPLATE_STATS };

export function templateLibraryStats() {
  return GENERATED_TEMPLATE_STATS;
}
