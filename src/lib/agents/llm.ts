/**
 * Thin wrapper the agents share for model calls.
 *
 * Routes to NVIDIA NIM when that is the active provider, with OmniRoute then
 * OpenRouter as fallbacks on transient NIM failures (429/529/overloaded).
 * Enforces a per-run call budget. Every helper returns `null` on failure
 * rather than throwing, so each agent is responsible for a deterministic
 * fallback and a single bad response can never abort a run.
 */

import { generateWithNvidia } from "@/lib/llm/nvidia";
import { generateWithOmniRoute } from "@/lib/llm/omnroute";
import { generateWithOpenRouter } from "@/lib/llm/openrouter";
import { DEFAULT_OPENROUTER_MODEL } from "@/lib/llm/openrouter-models";
import { hasOmniRoute } from "@/lib/llm/omnroute-models";
import { isOpenRouterStyleModel } from "@/lib/llm/nvidia-models";
import {
  extractJsonObject,
  type ChatMessage,
  type LlmProvider,
} from "@/lib/llm/types";
import { AGENT_BUDGET } from "./types";

export type LlmBudget = {
  used: number;
  max: number;
};

export type AgentLlmContext = {
  provider: LlmProvider;
  model?: string | null;
  budget: LlmBudget;
};

export function newLlmBudget(max: number = AGENT_BUDGET.maxLlmCalls): LlmBudget {
  return { used: 0, max };
}

export function budgetRemaining(budget: LlmBudget): number {
  return Math.max(0, budget.max - budget.used);
}

function hasNvidia(): boolean {
  return Boolean(process.env.NVIDIA_API_KEY);
}

function hasOpenRouter(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

/** True when the run should stay fully deterministic. */
export function isOffline(ctx: AgentLlmContext): boolean {
  if (budgetRemaining(ctx.budget) === 0) return true;
  if (ctx.provider === "demo") return true;
  if (ctx.provider === "nvidia") {
    return !hasNvidia() && !hasOmniRoute() && !hasOpenRouter();
  }
  if (ctx.provider === "omnroute") return !hasOmniRoute();
  if (ctx.provider === "openrouter" || ctx.provider === "openrouter-best") {
    return !hasOpenRouter();
  }
  return !hasNvidia() && !hasOmniRoute() && !hasOpenRouter();
}

async function callOpenRouter(
  messages: ChatMessage[],
  maxTokens: number,
  model?: string | null,
): Promise<string> {
  // Prefer a concrete free model over openrouter/free when falling back from
  // NVIDIA — the auto pool often returns empty bodies under load.
  const preferred =
    model && isOpenRouterStyleModel(model) ? model : null;
  const openRouterModel =
    preferred && preferred !== "openrouter/free"
      ? preferred
      : process.env.OPENROUTER_FALLBACK_MODELS?.split(",")
          .map((s) => s.trim())
          .find((m) => m && m !== "openrouter/free") ||
        "google/gemma-4-31b-it:free";
  return generateWithOpenRouter(messages, {
    maxTokens,
    json: true,
    model: openRouterModel || DEFAULT_OPENROUTER_MODEL,
  });
}

async function callOmniRoute(
  messages: ChatMessage[],
  maxTokens: number,
  model?: string | null,
): Promise<string> {
  return generateWithOmniRoute(messages, {
    maxTokens,
    json: true,
    model: model || undefined,
  });
}

export async function agentJson(
  ctx: AgentLlmContext,
  messages: ChatMessage[],
  maxTokens: number,
): Promise<unknown | null> {
  if (isOffline(ctx)) return null;

  ctx.budget.used += 1;
  try {
    if (ctx.provider === "nvidia" && hasNvidia()) {
      try {
        const raw = await generateWithNvidia(messages, {
          maxTokens,
          json: true,
          model: ctx.model && !isOpenRouterStyleModel(ctx.model)
            ? ctx.model
            : undefined,
        });
        return extractJsonObject(raw);
      } catch (nvidiaError) {
        if (hasOmniRoute()) {
          console.warn(
            "agent NVIDIA call failed, falling back to OmniRoute",
            nvidiaError instanceof Error ? nvidiaError.message : nvidiaError,
          );
          try {
            const raw = await callOmniRoute(messages, maxTokens, null);
            return extractJsonObject(raw);
          } catch (omnrouteError) {
            if (!hasOpenRouter()) throw omnrouteError;
            console.warn(
              "agent OmniRoute fallback failed, trying OpenRouter",
              omnrouteError instanceof Error
                ? omnrouteError.message
                : omnrouteError,
            );
            const raw = await callOpenRouter(messages, maxTokens, null);
            return extractJsonObject(raw);
          }
        }
        if (!hasOpenRouter()) throw nvidiaError;
        console.warn(
          "agent NVIDIA call failed, falling back to OpenRouter",
          nvidiaError instanceof Error ? nvidiaError.message : nvidiaError,
        );
        const raw = await callOpenRouter(messages, maxTokens, null);
        return extractJsonObject(raw);
      }
    }

    if (ctx.provider === "omnroute" && hasOmniRoute()) {
      const raw = await callOmniRoute(messages, maxTokens, ctx.model);
      return extractJsonObject(raw);
    }

    if (!hasOpenRouter()) {
      if (hasOmniRoute()) {
        const raw = await callOmniRoute(messages, maxTokens, ctx.model);
        return extractJsonObject(raw);
      }
      return null;
    }
    const raw = await callOpenRouter(messages, maxTokens, ctx.model);
    return extractJsonObject(raw);
  } catch (error) {
    console.warn(
      "agent model call failed",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
