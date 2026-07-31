export type {
  MagicBlueprint,
  BlueprintSection,
  BusinessAnalysis,
  CustomerStrategy,
  ConversionImprovement,
} from "./types";
export {
  buildMagicBlueprint,
  magicBlueprintToWebsiteBlueprint,
} from "./build";
export { runAgentDebate, type DebateSummary, type DebateOpinion } from "./debate";
