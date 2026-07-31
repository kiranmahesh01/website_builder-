/**
 * One-shot timing check for Manager → Designer → Developer generate path.
 *   npx tsx scripts/smoke-agent-loop.ts
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const { runAgentLoop } = await import("../src/lib/agents/orchestrator");
  const { resolveProvider } = await import("../src/lib/llm/types");

  const provider = resolveProvider(null);
  const prompt =
    "Brooklyn bakery called Rye & Salt — sourdough, pastries, wholesale orders, warm rustic style";

  console.log(`provider: ${provider}`);
  console.log(`prompt:   ${prompt}\n`);

  const started = Date.now();
  const run = await runAgentLoop({
    mode: "generate",
    request: prompt,
    provider,
    maxFixAttempts: 1,
  });
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  console.log(`completed in ${elapsed}s`);
  console.log(`brand:     ${run.spec.brand}`);
  console.log(`theme:     ${run.spec.theme}`);
  console.log(`industry:  ${run.blueprint?.industry}`);
  console.log(`designer:  ${run.blueprint?.source}`);
  console.log(`buttonBg:  ${run.spec.design?.buttonBg}`);
  console.log(`passed:    ${run.passed}`);
  console.log(`agent LLM: ${run.llmCalls}`);
  console.log(
    `sections:  ${run.spec.pages[0]?.sections.map((s) => s.id).join(" → ")}`,
  );
  console.log(
    `roles:     ${[...new Set(run.events.map((e) => e.role))].join(", ")}`,
  );

  const text = JSON.stringify(run.spec).toLowerCase();
  const hits = [
    "rye",
    "salt",
    "sourdough",
    "pastr",
    "wholesale",
    "brooklyn",
  ].filter((w) => text.includes(w));
  console.log(`\nbrief terms present: ${hits.join(", ") || "NONE"}`);
  console.log(
    hits.length >= 4
      ? "PASS — agent path grounded in the brief."
      : "WEAK — output looks generic.",
  );
}

main().catch((error) => {
  console.error("FAILED:", error instanceof Error ? error.message : error);
  process.exit(1);
});
