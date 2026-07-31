/**
 * Client-safe conversational intake for /create — scripted partner questions
 * that fill CreateWizardAnswers without an LLM call.
 * Industry DNA discovery questions deepen Business Understanding.
 */

import { matchWebsiteDna } from "@/lib/dna";
import type { CreateWizardAnswers, StyleId, WebsiteTypeId } from "./brief";
import { STYLES, WEBSITE_TYPES } from "./brief";

export type ChatTurn = {
  role: "assistant" | "user";
  content: string;
};

export type ConversationQuestion = {
  id: keyof CreateWizardAnswers | "confirm" | "coffeeModel" | "coffeeCustomers" | "diningStyle" | "bookingGoal" | "saasBuyer" | "saasMotion" | "reFocus" | "reArea" | "fitnessOffer" | "fitnessOfferType" | "hotelType" | "bookingChannel" | "portfolioCraft" | "portfolioIdeal" | "ecomCatalog" | "ecomFulfillment" | string;
  prompt: string;
  hint?: string;
  choices?: { id: string; label: string }[];
  freeText?: boolean;
};

const BASE_BEFORE_INDUSTRY: ConversationQuestion[] = [
  {
    id: "websiteType",
    prompt: "What kind of website are we building?",
    choices: WEBSITE_TYPES.map((t) => ({ id: t.id, label: t.label })),
  },
  {
    id: "industry",
    prompt: "What industry or niche is this for?",
    hint: "Coffee, restaurant, real estate, fitness, SaaS — or type your own.",
    choices: [
      { id: "Coffee", label: "Coffee" },
      { id: "Restaurant", label: "Restaurant" },
      { id: "Real estate", label: "Real estate" },
      { id: "Fitness", label: "Fitness" },
      { id: "SaaS", label: "SaaS" },
      { id: "Hotel", label: "Hotel" },
      { id: "Portfolio", label: "Portfolio" },
      { id: "Ecommerce", label: "Ecommerce" },
    ],
    freeText: true,
  },
];

const BASE_AFTER_DNA: ConversationQuestion[] = [
  {
    id: "style",
    prompt: "Which visual style feels right?",
    choices: STYLES.map((s) => ({ id: s.id, label: s.label })),
  },
  {
    id: "businessName",
    prompt: "What’s the business or brand name?",
    hint: "e.g. Northbeam Coffee",
    freeText: true,
  },
  {
    id: "goal",
    prompt: "What’s the main goal of the site?",
    hint: "Attract walk-ins, sell products, book calls…",
    freeText: true,
  },
  {
    id: "targetCustomers",
    prompt: "Who are you trying to reach?",
    freeText: true,
  },
  {
    id: "brandFeeling",
    prompt: "How should the brand feel?",
    hint: "Warm and artisan, bold and loud, calm and minimal…",
    freeText: true,
  },
  {
    id: "colors",
    prompt: "Any color preferences?",
    hint: "Optional — e.g. espresso browns and cream",
    freeText: true,
  },
  {
    id: "extraDetails",
    prompt: "Anything else I should know before planning?",
    hint: "Must-have sections, pages, or things to avoid. Or say “ready”.",
    freeText: true,
  },
];

function dnaQuestions(industry: string): ConversationQuestion[] {
  if (!industry.trim()) return [];
  const match = matchWebsiteDna(industry, industry);
  return match.dna.discoveryQuestions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    hint: q.hint,
    freeText: true,
  }));
}

/** Industry-aware question list for Business Understanding Agent. */
export function conversationQuestions(industryHint?: string): ConversationQuestion[] {
  return [
    ...BASE_BEFORE_INDUSTRY,
    ...dnaQuestions(industryHint || ""),
    ...BASE_AFTER_DNA,
  ];
}

export function applyConversationAnswer(
  answers: CreateWizardAnswers,
  questionId: ConversationQuestion["id"],
  raw: string,
): CreateWizardAnswers {
  const value = raw.trim();
  const next = { ...answers };

  switch (questionId) {
    case "websiteType": {
      const id = value.toLowerCase().replace(/\s+/g, "") as WebsiteTypeId;
      const match = WEBSITE_TYPES.find(
        (t) =>
          t.id === value.toLowerCase() ||
          t.label.toLowerCase() === value.toLowerCase() ||
          t.id === id,
      );
      if (match) next.websiteType = match.id;
      break;
    }
    case "industry": {
      const known = [
        "Coffee",
        "Restaurant",
        "Real estate",
        "Fitness",
        "SaaS",
        "Hotel",
        "Portfolio",
        "Ecommerce",
      ];
      const hit = known.find((k) => k.toLowerCase() === value.toLowerCase());
      if (hit) {
        next.industry = hit;
        next.industryCustom = "";
      } else {
        next.industryCustom = value;
        next.industry = value;
      }
      break;
    }
    case "style": {
      const match = STYLES.find(
        (s) =>
          s.id === value.toLowerCase() ||
          s.label.toLowerCase() === value.toLowerCase(),
      );
      if (match) next.style = match.id as StyleId;
      break;
    }
    case "businessName":
    case "goal":
    case "targetCustomers":
    case "brandFeeling":
    case "colors":
    case "extraDetails":
      if (questionId === "extraDetails" && /^(ready|no|none|skip)$/i.test(value)) {
        next.extraDetails = answers.extraDetails;
      } else {
        next[questionId] = value;
      }
      break;
    default: {
      // DNA discovery answers append into extraDetails / goal enrichment.
      const line = `${questionId}: ${value}`;
      next.extraDetails = next.extraDetails
        ? `${next.extraDetails}\n${line}`
        : line;
      if (/customer|audience|buyer|who/i.test(questionId) && !next.targetCustomers) {
        next.targetCustomers = value;
      }
      if (/model|motion|focus|offer|catalog|type|style|channel/i.test(questionId) && !next.goal) {
        next.goal = value;
      }
      break;
    }
  }

  return next;
}

export function openingMessage(): string {
  return "Tell Magic AI your business idea — I’ll plan like a strategist, then design, build, and improve your website. A few quick questions, then your Magic Blueprint.";
}
