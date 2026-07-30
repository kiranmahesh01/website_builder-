import { parseBrief, scoreBriefAdherence } from "@/lib/brief-parser";
import { type Website } from "@/lib/schema";
import { parseWebsiteLenient } from "@/lib/site-coerce";
import { generateWithOpenRouter } from "./openrouter";
import {
  DEFAULT_OPENROUTER_BEST_MODELS,
  PAID_FALLBACK_MODEL,
  openRouterBestModels,
} from "./openrouter-models";
import { scoreWebsite } from "./score-site";
import { extractJsonObject, type ChatMessage } from "./types";

export { openRouterBestModels, DEFAULT_OPENROUTER_BEST_MODELS };

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
  prompt: string,
): Promise<{ site: Website; raw: string; model: string; adherence: number }> {
  const raw = await generateWithOpenRouter(messages, {
    model,
    json: false,
    maxTokens: 5500,
  });
  const json = extractJsonObject(raw);
  const site = json ? parseWebsiteLenient(json) : null;
  if (!site) {
    throw new Error(`Invalid schema from ${model}`);
  }
  const adherence = scoreBriefAdherence(site, parseBrief(prompt));
  return { site, raw, model, adherence };
}

/**
 * Race free OpenRouter models; pick best brief adherence among valid JSON.
 * Falls back to OPENROUTER_MODEL if all free models fail.
 */
export async function generateOpenRouterBestOf(
  messages: ChatMessage[],
  prompt: string,
): Promise<BestOfResult> {
  const models = openRouterBestModels();
  if (!models.length) {
    throw new Error("No OpenRouter best-of models configured.");
  }

  const errors: string[] = [];
  const valid: {
    site: Website;
    raw: string;
    model: string;
    adherence: number;
  }[] = [];

  const racers = models.map(async (model) => {
    try {
      const result = await tryModel(messages, model, prompt);
      valid.push(result);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      errors.push(err);
      throw e instanceof Error ? e : new Error(err);
    }
  });

  try {
    await Promise.allSettled(racers);

    if (valid.length > 0) {
      valid.sort(
        (a, b) =>
          b.adherence - a.adherence ||
          scoreWebsite(b.site) - scoreWebsite(a.site),
      );
      const winner = valid[0];
      return {
        site: winner.site,
        raw: winner.raw,
        model: winner.model,
        score: scoreWebsite(winner.site),
        attempts: models.length,
        validCount: valid.length,
        modelsTried: models,
        mode: "race",
      };
    }

    throw new AggregateError(errors.map((e) => new Error(e)));
  } catch (err) {
    const fallbackModel =
      process.env.OPENROUTER_MODEL || PAID_FALLBACK_MODEL;
    try {
      const winner = await tryModel(messages, fallbackModel, prompt);
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
        `Could not generate a valid site. Free models: ${detail || "failed"}. Fallback ${fallbackModel}: ${fb}`,
      );
    }
  }
}
