import type { DesignSystem } from "@/lib/design-system";
import type { DnaMatch } from "@/lib/dna";
import type { DebateSummary } from "./debate";

export type BlueprintSection = {
  id: string;
  label: string;
  why: string;
  priority: "must" | "high" | "optional";
  expectedLift: string;
};

export type BusinessAnalysis = {
  industry: string;
  businessModelHints: string[];
  positioning: string;
  risks: string[];
  opportunities: string[];
};

export type CustomerStrategy = {
  primaryAudience: string;
  desires: string[];
  fears: string[];
  decisionTriggers: string[];
  messagingPillars: string[];
  recommendedOffers: string[];
};

export type ConversionImprovement = {
  title: string;
  why: string;
  relatedSection?: string;
};

export type MagicBlueprint = {
  version: 1;
  title: string;
  summary: string;
  businessAnalysis: BusinessAnalysis;
  customerStrategy: CustomerStrategy;
  websiteStructure: BlueprintSection[];
  designPlan: DesignSystem;
  conversionImprovements: ConversionImprovement[];
  strategyRecommendations: string[];
  debate: DebateSummary;
  dna: {
    id: string;
    industry: string;
    confidence: DnaMatch["confidence"];
    matchedAliases: string[];
  };
  expandedBrief: string;
  pages: string[];
  templateHints: string[];
};
