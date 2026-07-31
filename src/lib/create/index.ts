export {
  WEBSITE_TYPES,
  INDUSTRIES,
  STYLES,
  EMPTY_CREATE_ANSWERS,
  composeStructuredBrief,
  resolveIndustry,
  styleLabel,
  websiteTypeLabel,
  suggestedPages,
  suggestedSections,
  suggestedFeatures,
  seedAnswersFromPrompt,
  type WebsiteTypeId,
  type StyleId,
  type CreateWizardAnswers,
} from "./brief";
export {
  buildWebsitePlan,
  BROWSE_CATEGORY_GROUPS,
  type WebsitePlanPreview,
  type PlanTemplateCard,
} from "./plan";
export { buildBrandKit, type BrandKit } from "./brand-kit";
export {
  conversationQuestions,
  applyConversationAnswer,
  openingMessage,
  type ChatTurn,
  type ConversationQuestion,
} from "./conversation";
export { mapIndustryToTemplate, enrichBriefForSearch } from "./industry";

// Re-export strategist stack entry points used by create / generate.
export { buildMagicBlueprint } from "@/lib/blueprint";
export { matchWebsiteDna } from "@/lib/dna";
export { expandPromptToExpertBrief } from "@/lib/prompt";
