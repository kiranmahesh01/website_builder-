/**
 * Website DNA — industry playbooks that ground conversation, blueprint,
 * design system, and content prompts in conversion psychology (not templates alone).
 */

export type DnaSectionRec = {
  id: string;
  label: string;
  why: string;
  priority: "must" | "high" | "optional";
};

export type WebsiteDna = {
  id: string;
  industry: string;
  aliases: string[];
  /** Customer psychology cues for copy + UX. */
  psychology: {
    desires: string[];
    fears: string[];
    decisionTriggers: string[];
    tone: string[];
  };
  bestSections: DnaSectionRec[];
  colors: {
    primary: string;
    accent: string;
    surface: string;
    text: string;
    notes: string;
  };
  ctas: {
    primary: string[];
    secondary: string[];
    strength: "soft" | "medium" | "strong";
  };
  trustElements: string[];
  conversionPatterns: string[];
  /** Follow-up questions for Business Understanding Agent. */
  discoveryQuestions: { id: string; prompt: string; hint?: string }[];
  /** Strategy recommendations surfaced in Blueprint. */
  strategyTips: string[];
};

export type DnaMatch = {
  dna: WebsiteDna;
  score: number;
  matchedAliases: string[];
  confidence: "high" | "medium" | "low";
};
