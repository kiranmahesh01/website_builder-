import { type Website } from "@/lib/schema";
import { parseWebsiteLenient } from "@/lib/site-coerce";
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
  mode: "race" | "fallback";
};

async function tryModel(
  messages: ChatMessage[],
  model: string,
): Promise<{ site: Website; raw: string; model: string }> {
  const raw = await generateWithOpenRouter(messages, {
    model,
    json: !model.includes(":free"),
  });
  const json = extractJsonObject(raw);
  const site = json ? parseWebsiteLenient(json) : null;
  if (!site) {
    throw new Error(`Invalid schema from ${model}`);
  }
  return { site, raw, model };
}

/**
 * Race free OpenRouter models; first valid Zod JSON wins.
 * If all free models fail, fall back to OPENROUTER_MODEL (gpt-4o-mini).
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
    try {
      return await tryModel(messages, model);
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      errors.push(err);
      throw e instanceof Error ? e : new Error(err);
    }
  });

  try {
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
  } catch {
    const fallbackModel =
      process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
    try {
      const winner = await tryModel(messages, fallbackModel);
      return {
        site: winner.site,
        raw: winner.raw,
        model: winner.model,
        score: scoreWebsite(winner.site),
        attempts: models.length + 1,
        validCount: 1,
        modelsTried: [...models, fallbackModel],
        mode: "fallback",
      };
    } catch (fallbackErr) {
      const detail = errors.slice(0, 2).join(" | ");
      const fb =
        fallbackErr instanceof Error
          ? fallbackErr.message
          : String(fallbackErr);
      throw new Error(
        `Could not generate valid site JSON. Free race failed (${detail || "no valid JSON"}). Fallback ${fallbackModel}: ${fb}`,
      );
    }
  }
}
