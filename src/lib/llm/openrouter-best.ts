import { parseWebsite, type Website } from "@/lib/schema";
import { generateWithOpenRouter } from "./openrouter";
import { scoreWebsite } from "./score-site";
import { extractJsonObject, type ChatMessage } from "./types";

/** Free OpenRouter models that currently accept chat completions. */
export const DEFAULT_OPENROUTER_BEST_MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "openai/gpt-oss-20b:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
];

export function openRouterBestModels(): string[] {
  const raw = process.env.OPENROUTER_BEST_MODELS?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return DEFAULT_OPENROUTER_BEST_MODELS;
}

export type BestOfResult = {
  site: Website;
  raw: string;
  model: string;
  score: number;
  attempts: number;
  validCount: number;
  modelsTried: string[];
  mode: "race";
};

/**
 * Race several free OpenRouter models in parallel.
 * First response that passes Zod schema wins (faster).
 * Other in-flight calls are ignored for the result.
 */
export async function generateOpenRouterBestOf(
  messages: ChatMessage[],
): Promise<BestOfResult> {
  const models = openRouterBestModels();
  if (!models.length) {
    throw new Error("No OpenRouter best-of models configured.");
  }

  const errors: string[] = [];

  const racers = models.map(async (model) => {
    const raw = await generateWithOpenRouter(messages, { model });
    const json = extractJsonObject(raw);
    const site = json ? parseWebsite(json) : null;
    if (!site) {
      const err = `Invalid schema from ${model}`;
      errors.push(err);
      throw new Error(err);
    }
    return { site, raw, model };
  });

  try {
    // Promise.any → first fulfilled (valid JSON) wins
    const winner = await Promise.any(racers);
    return {
      site: winner.site,
      raw: winner.raw,
      model: winner.model,
      score: scoreWebsite(winner.site),
      attempts: models.length,
      validCount: 1,
      modelsTried: models,
      mode: "race",
    };
  } catch (err) {
    const detail =
      err instanceof AggregateError
        ? err.errors
            .map((e) => (e instanceof Error ? e.message : String(e)))
            .slice(0, 3)
            .join(" | ")
        : errors[0] || (err instanceof Error ? err.message : String(err));
    throw new Error(
      `Race found no valid site JSON from ${models.length} free models. ${detail}`,
    );
  }
}
