/**
 * Offline check of the agent loop: no network, no database, no model calls.
 *
 * Covers target resolution, patch application, the deterministic reviewer,
 * the repair path, and a full demo-provider orchestrator run.
 *
 * Run: npx tsx scripts/eval-agents.ts
 */

import { buildDemoSpec } from "@/lib/spec/demo-spec";
import { withSectionKeys, type SiteSpec } from "@/lib/spec/schema";
import { buildMemory, resolveTargets } from "@/lib/agents/memory";
import { applyPatch } from "@/lib/agents/patch";
import { deterministicRepair } from "@/lib/agents/fixer";
import { reviewSpec } from "@/lib/agents/reviewer";
import { runAgentLoop } from "@/lib/agents/orchestrator";

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const PROMPT =
  "Petal & Stem — orchid boutique in Brooklyn with online shop and pickup";

async function main() {
  const base = withSectionKeys(buildDemoSpec(PROMPT));
  const memory = buildMemory(base);

  console.log("\nProject memory");
  check("indexes pages", memory.pages.length >= 1);
  check(
    "indexes sections with stable keys",
    memory.pages[0].sections.every((s) => /^[\w-]+\.[a-z_0-9]+#\d+$/.test(s.key)),
    memory.pages[0].sections[0]?.key,
  );
  check(
    "classifies at least one button component",
    memory.pages[0].sections.some((s) =>
      s.components.some((c) => c.kind === "button"),
    ),
  );

  console.log("\nTarget resolution");
  const buttonColor = resolveTargets(memory, "change the button color to blue");
  check("button colour is high confidence", buttonColor.confidence === "high");
  check(
    "button colour maps to the buttonBg design token",
    buttonColor.targets[0]?.kind === "design_token" &&
      buttonColor.targets[0].token === "buttonBg" &&
      buttonColor.targets[0].value === "#2563EB",
    JSON.stringify(buttonColor.targets[0]),
  );

  const heroButton = resolveTargets(memory, "make the hero button dark green");
  check(
    "scoped colour resolves to a section token",
    heroButton.targets[0]?.kind === "section_token" &&
      heroButton.targets[0].sectionKey.includes("hero"),
    JSON.stringify(heroButton.targets[0]),
  );

  const headline = resolveTargets(memory, "rewrite the hero headline");
  check(
    "copy edits resolve to a slot",
    headline.targets.some((t) => t.kind === "slot" && t.slot === "headline"),
    JSON.stringify(headline.targets[0]),
  );

  const vague = resolveTargets(memory, "make it nicer");
  check("vague requests fall back to low confidence", vague.confidence === "low");

  console.log("\nPatch application");
  const patched = applyPatch(base, [
    { op: "set_design_token", token: "buttonBg", value: "#2563EB" },
  ]);
  check("valid token op applies", patched.applied.length === 1);
  check("spec records the token", patched.spec.design?.buttonBg === "#2563EB");

  const badColor = applyPatch(base, [
    { op: "set_design_token", token: "buttonBg", value: "blue" },
  ]);
  check(
    "non-hex colour is rejected, not applied",
    badColor.applied.length === 0 && badColor.rejected.length === 1,
  );

  const badTarget = applyPatch(base, [
    { op: "set_slot", sectionKey: "home.does_not_exist#9", slot: "headline", value: "x" },
  ]);
  check(
    "unknown section key is rejected",
    badTarget.applied.length === 0 && badTarget.rejected.length === 1,
  );

  console.log("\nReviewer");
  const clean = await reviewSpec({ spec: base });
  check("a demo spec passes review", clean.passed, JSON.stringify(clean.issues.slice(0, 2)));
  check("render smoke test produced HTML", (clean.html?.length || 0) > 1200);

  const broken: SiteSpec = JSON.parse(JSON.stringify(base));
  broken.pages[0].sections[0].content.headline =
    "This headline is deliberately far too long for the slot limit and should be caught by the reviewer before anyone sees it";
  delete broken.pages[0].sections[1].content.headline;
  const brokenReview = await reviewSpec({ spec: broken });
  check("over-long and missing copy fails review", !brokenReview.passed);
  check(
    "issues carry a section key for the fix agent",
    brokenReview.issues.some((i) => Boolean(i.sectionKey)),
  );

  console.log("\nFix agent (deterministic)");
  const repaired = deterministicRepair(broken, brokenReview.issues);
  check("repair reports what it changed", repaired.repaired.length > 0);
  const afterRepair = await reviewSpec({ spec: repaired.spec });
  check(
    "repaired spec passes review",
    afterRepair.passed,
    JSON.stringify(afterRepair.issues.slice(0, 2)),
  );

  console.log("\nOrchestrator (demo provider, no model calls)");
  const run = await runAgentLoop({
    mode: "refine",
    request: "change the button color to blue",
    provider: "demo",
    spec: base,
    memory,
  });
  check("run spends zero model calls", run.llmCalls === 0);
  check("run passes review", run.passed, JSON.stringify(run.review.issues.slice(0, 2)));
  check("run reports a change", run.changed);
  check(
    "token reached the rendered HTML",
    run.html.includes("#2563EB"),
    run.html.slice(0, 0),
  );
  check(
    "planner and reviewer both emitted events",
    run.events.some((e) => e.role === "planner") &&
      run.events.some((e) => e.role === "reviewer"),
  );
  check("change log summary is human readable", run.summary.length > 0);
  console.log(`    summary: ${run.summary}`);

  const scoped = await runAgentLoop({
    mode: "refine",
    request: "make the footer background dark navy",
    provider: "demo",
    spec: base,
    memory,
  });
  check(
    "scoped request only touches the named section",
    scoped.ops.every((op) => "sectionKey" in op && op.sectionKey.includes("footer")),
    JSON.stringify(scoped.ops),
  );

  const impossible = await runAgentLoop({
    mode: "refine",
    request: "do something clever",
    provider: "demo",
    spec: base,
    memory,
  });
  check(
    "an unresolvable request is a safe no-op",
    !impossible.changed && impossible.passed,
  );

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
