/**
 * Probes the NVIDIA NIM catalog with your key and reports which models are
 * actually usable for the spec pipeline, ranked by JSON reliability and speed.
 *
 *   npx tsx scripts/probe-nvidia.ts                 # probe the built-in candidates
 *   npx tsx scripts/probe-nvidia.ts --all           # probe every chat model in /v1/models
 *   npx tsx scripts/probe-nvidia.ts --deep          # add a heavy content-generation round
 *   npx tsx scripts/probe-nvidia.ts --models=a,b    # probe specific ids
 *
 * The free tier is rate limited (~40 req/min) rather than credit limited, so
 * requests are paced by a rolling-window limiter and 429s are retried with
 * backoff. A rate-limited model is reported separately from a broken one.
 */
import { config } from "dotenv";
import OpenAI from "openai";
import { NVIDIA_BASE_URL, NVIDIA_MODEL_CANDIDATES } from "../src/lib/llm/nvidia-models";
import { extractJsonObject } from "../src/lib/llm/types";
import { PLAN_SYSTEM_PROMPT, planUserMessage } from "../src/lib/spec/prompts";
import { parsePlan } from "../src/lib/spec/schema";

config({ path: ".env.local" });
config();

const apiKey = process.env.NVIDIA_API_KEY;
if (!apiKey) {
  console.error(
    "NVIDIA_API_KEY is not set. Get a free key at https://build.nvidia.com and add it to .env",
  );
  process.exit(1);
}

const client = new OpenAI({ apiKey, baseURL: NVIDIA_BASE_URL, maxRetries: 0 });

function numFlag(name: string, fallback: number): number {
  const raw = process.argv.find((a) => a.startsWith(`--${name}=`));
  const parsed = raw ? Number(raw.split("=")[1]) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const RPM = numFlag("rpm", 24);
const CONCURRENCY = numFlag("concurrency", 4);
const REQUEST_TIMEOUT_MS = numFlag("timeout", 150) * 1000;
const MAX_429_RETRIES = 3;

/**
 * Catalog entries that are not chat completions endpoints (embedding, ranking,
 * safety, OCR/parse, and pure vision models) — calling them just wastes budget.
 */
const NON_CHAT = /embed|rerank|retriev|guard|safety|content-safety|topic-control|reward|parse|ocr|nvclip|deplot|kosmos|fuyu|neva|vila|nemoretriever|translate|diffusion|video-detector|-vl-|nvidia\/vila|calibration/i;

const BRIEF =
  "A Brooklyn sourdough bakery called Rye & Salt. Naturally leavened loaves, " +
  "morning pastries, and a small counter for coffee. Wants walk-in customers " +
  "from Williamsburg plus wholesale accounts with local restaurants.";

type Outcome = "ok" | "bad-json" | "error" | "rate-limited" | "timeout";

type Probe = {
  model: string;
  outcome: Outcome;
  ms: number;
  jsonMode: boolean;
  score: number;
  reasoning: boolean;
  brand: string | null;
  note: string;
};

/** Rolling-window limiter: never start more than RPM requests in any 60s. */
const starts: number[] = [];
async function acquireSlot(): Promise<void> {
  for (;;) {
    const now = Date.now();
    while (starts.length > 0 && now - starts[0] > 60_000) starts.shift();
    if (starts.length < RPM) {
      starts.push(now);
      return;
    }
    await sleep(60_000 - (now - starts[0]) + 50);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimit(message: string): boolean {
  return /\b429\b|rate limit|too many requests/i.test(message);
}

/**
 * Reasoning models return their chain of thought either in a separate
 * reasoning_content field or wrapped in <think> tags inside content.
 */
function splitReasoning(raw: string): { text: string; hadThinkTags: boolean } {
  if (!/<\/?(think|thinking|reasoning)\b/i.test(raw)) {
    return { text: raw, hadThinkTags: false };
  }
  const closed = raw.replace(
    /<(think|thinking|reasoning)\b[^>]*>[\s\S]*?<\/\1>/gi,
    "",
  );
  // An unterminated opening tag means everything after it is still reasoning.
  const text = closed.replace(/<(think|thinking|reasoning)\b[^>]*>[\s\S]*$/i, "");
  return { text: text.trim(), hadThinkTags: true };
}

/** 0–100: does this look like a plan the pipeline could actually use? */
function scorePlan(parsed: unknown): { score: number; brand: string | null; note: string } {
  const plan = parsePlan(parsed);
  if (!plan) {
    const obj = parsed as Record<string, unknown> | null;
    const keys = obj && typeof obj === "object" ? Object.keys(obj).join(",") : "?";
    return { score: 20, brand: null, note: `JSON but schema-invalid (keys: ${keys})` };
  }

  let score = 60;
  const notes: string[] = [];

  if (/rye\s*&?\s*salt/i.test(plan.brand)) score += 20;
  else notes.push(`brand="${plan.brand}"`);

  if (plan.pages.length >= 1 && plan.pages.length <= 2) score += 10;
  else notes.push(`${plan.pages.length} pages`);

  if (plan.pages[0]?.slug === "home") score += 5;

  const intent = plan.pages[0]?.intent ?? "";
  if (/williamsburg|brooklyn|sourdough|wholesale|bakery/i.test(intent)) score += 5;
  else notes.push("generic intent");

  return {
    score,
    brand: plan.brand,
    note: notes.length ? notes.join("; ") : "valid plan, brief-specific",
  };
}

async function callOnce(
  model: string,
  jsonMode: boolean,
): Promise<{ content: string; reasoning: boolean }> {
  const completion = await client.chat.completions.create(
    {
      model,
      temperature: 0.4,
      max_tokens: 900,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: PLAN_SYSTEM_PROMPT },
        { role: "user", content: planUserMessage(BRIEF) },
      ],
    },
    { timeout: REQUEST_TIMEOUT_MS },
  );

  const message = completion.choices[0]?.message as
    | { content?: string | null; reasoning_content?: string | null }
    | undefined;

  const raw = message?.content ?? "";
  const { text, hadThinkTags } = splitReasoning(raw);
  const hadReasoningField = Boolean(message?.reasoning_content?.trim());

  return { content: text, reasoning: hadThinkTags || hadReasoningField };
}

async function attempt(model: string, jsonMode: boolean): Promise<Probe> {
  const started = Date.now();
  for (let retry = 0; ; retry++) {
    await acquireSlot();
    try {
      const { content, reasoning } = await callOnce(model, jsonMode);
      const ms = Date.now() - started;

      if (!content.trim()) {
        return {
          model, outcome: "bad-json", ms, jsonMode, score: 0, reasoning,
          brand: null, note: "empty response",
        };
      }

      const parsed = extractJsonObject(content);
      if (!parsed) {
        return {
          model, outcome: "bad-json", ms, jsonMode, score: 0, reasoning,
          brand: null, note: `unparseable: ${content.slice(0, 60).replace(/\s+/g, " ")}`,
        };
      }

      const { score, brand, note } = scorePlan(parsed);
      return { model, outcome: "ok", ms, jsonMode, score, reasoning, brand, note };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (isRateLimit(message)) {
        if (retry < MAX_429_RETRIES) {
          await sleep(5_000 * 2 ** retry);
          continue;
        }
        return {
          model, outcome: "rate-limited", ms: Date.now() - started, jsonMode,
          score: 0, reasoning: false, brand: null, note: "429 after retries",
        };
      }

      if (/timed? ?out|ETIMEDOUT|aborted/i.test(message)) {
        return {
          model, outcome: "timeout", ms: Date.now() - started, jsonMode,
          score: 0, reasoning: false, brand: null,
          note: `no response in ${REQUEST_TIMEOUT_MS / 1000}s`,
        };
      }

      return {
        model, outcome: "error", ms: Date.now() - started, jsonMode, score: 0,
        reasoning: false, brand: null, note: message.split("\n")[0].slice(0, 110),
      };
    }
  }
}

function rejectsJsonMode(note: string): boolean {
  return /400|response_format|unsupported|invalid.*(parameter|value)|not support/i.test(note);
}

async function probe(model: string): Promise<Probe> {
  const withJson = await attempt(model, true);
  if (withJson.outcome === "ok") return withJson;

  // Some catalog entries reject response_format, and some reasoning models
  // produce better output without it — retry as plain text before judging.
  if (withJson.outcome === "error" && !rejectsJsonMode(withJson.note)) return withJson;
  if (withJson.outcome === "rate-limited" || withJson.outcome === "timeout") return withJson;

  const withText = await attempt(model, false);
  return withText.outcome === "ok" ? withText : withJson;
}

async function runPool(models: string[]): Promise<Probe[]> {
  const results: Probe[] = [];
  let cursor = 0;

  const worker = async () => {
    for (;;) {
      const index = cursor++;
      if (index >= models.length) return;
      const result = await probe(models[index]);
      results.push(result);
      report(result, results.length, models.length);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, models.length) }, worker),
  );
  return results;
}

const LABEL: Record<Outcome, string> = {
  ok: "OK   ",
  "bad-json": "BADJS",
  error: "ERROR",
  "rate-limited": "429  ",
  timeout: "TMOUT",
};

function report(r: Probe, done: number, total: number) {
  const progress = `[${String(done).padStart(3)}/${total}]`;
  const score = r.outcome === "ok" ? `q=${String(r.score).padStart(3)}` : "     ";
  const think = r.reasoning ? " <think>" : "";
  console.log(
    `${progress} ${LABEL[r.outcome]} ${String(r.ms).padStart(6)}ms ${score} ` +
      `${r.jsonMode ? "json" : "text"} ${r.model}${think} — ${r.note}`,
  );
}

async function main() {
  const useAll = process.argv.includes("--all");
  const explicit = process.argv.find((a) => a.startsWith("--models="));

  let models: string[];
  if (explicit) {
    models = explicit.split("=")[1].split(",").map((s) => s.trim()).filter(Boolean);
  } else if (useAll) {
    const catalog = (await client.models.list()).data.map((m) => m.id).sort();
    console.log(`Catalog reports ${catalog.length} models.`);
    models = catalog.filter((id) => !NON_CHAT.test(id));
    console.log(`${models.length} look like chat models.`);
  } else {
    models = [...NVIDIA_MODEL_CANDIDATES];
  }

  // The user confirmed this one works on their account — always measure it.
  if (!models.includes("z-ai/glm-5.2")) models.push("z-ai/glm-5.2");

  console.log(
    `\nProbing ${models.length} model(s) with the real PLAN prompt ` +
      `(${CONCURRENCY} concurrent, ${RPM} req/min cap)…\n`,
  );

  const results = await runPool(models);

  const working = results
    .filter((r) => r.outcome === "ok")
    .sort((a, b) => b.score - a.score || a.ms - b.ms);
  const rateLimited = results.filter((r) => r.outcome === "rate-limited");

  console.log(`\n${"=".repeat(78)}`);
  console.log(`${working.length}/${results.length} usable.`);
  if (rateLimited.length) {
    console.log(
      `${rateLimited.length} inconclusive (rate limited, not broken): ` +
        rateLimited.map((r) => r.model).join(", "),
    );
  }

  if (working.length > 0) {
    console.log("\nRanked by plan quality, then latency:\n");
    for (const r of working) {
      console.log(
        `  q=${String(r.score).padStart(3)}  ${String(r.ms).padStart(6)}ms  ` +
          `${r.jsonMode ? "json" : "text"}${r.reasoning ? "  <think>" : "        "}  ` +
          `${r.model}  (${r.brand})`,
      );
    }

    console.log("\nRecommended .env settings:\n");
    console.log(`NVIDIA_MODEL="${working[0].model}"`);
    console.log(
      `NVIDIA_FALLBACK_MODELS="${working.slice(1, 6).map((r) => r.model).join(",")}"`,
    );

    const thinkers = working.filter((r) => r.reasoning).map((r) => r.model);
    if (thinkers.length) {
      console.log(`\nEmit reasoning that must be stripped: ${thinkers.join(", ")}`);
    }
    const textOnly = working.filter((r) => !r.jsonMode).map((r) => r.model);
    if (textOnly.length) {
      console.log(`Rejected response_format (text mode only): ${textOnly.join(", ")}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
