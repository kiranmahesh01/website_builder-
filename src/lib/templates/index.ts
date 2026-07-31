export type {
  AiTemplate,
  TemplateCategory,
  TemplateStyle,
  CopyPatterns,
  TemplateMatch,
  TemplateSearchResult,
  MixRequest,
  MixedTemplate,
} from "./types";
export { TEMPLATE_CATEGORIES, TEMPLATE_STYLES } from "./types";
export {
  searchTemplates,
  formatTemplateMatchesForPrompt,
  countTemplatesByCategory,
  mixTemplates,
  mixFromBrief,
  applyTemplateEngine,
  mixedToApplied,
} from "./engine";
export type { AppliedTemplateBlueprint } from "./engine";
export {
  getTemplateLibrary,
  getTemplateById,
  getTemplatesByIndustry,
  getTemplatesByCategory,
  templateLibraryStats,
} from "./library";
export { generateTemplateLibrary } from "./generate";
