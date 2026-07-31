/**
 * Offline check of the agent loop: no network, no database, no model calls.
 *
 * Covers KB retrieval, manager transitions, deterministic designer, target
 * resolution, patch application, the reviewer, the repair path, and a full
 * demo-provider orchestrator run.
 *
 * Run: npx tsx scripts/eval-agents.ts
 */

import { buildDemoSpec } from "@/lib/spec/demo-spec";
import { withSectionKeys, type SiteSpec } from "@/lib/spec/schema";
import { retrieveTemplates } from "@/lib/knowledge";
import {
  applyTemplateEngine,
  countTemplatesByCategory,
  mixTemplates,
  searchTemplates,
  templateLibraryStats,
} from "@/lib/templates";
import { buildMemory, resolveTargets } from "@/lib/agents/memory";
import { applyPatch } from "@/lib/agents/patch";
import { deterministicRepair } from "@/lib/agents/fixer";
import { reviewSpec } from "@/lib/agents/reviewer";
import { runAgentLoop } from "@/lib/agents/orchestrator";
import { decideNextStep, type ManagerState } from "@/lib/agents/manager";
import {
  blueprintFromTemplates,
  runDesigner,
} from "@/lib/agents/designer";
import { planFromBrief } from "@/lib/agents/planner";
import { newLlmBudget } from "@/lib/agents/llm";
import { ensureSeo } from "@/lib/agents/seo";
import { validateStructure } from "@/lib/spec/validate";

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

  console.log("\nAI Template Engine");
  const stats = templateLibraryStats();
  check("library has ≥280 templates", stats.total >= 280, String(stats.total));
  check("landing ≈100", stats.byCategory.landing >= 90, String(stats.byCategory.landing));
  check("saas ≈50", stats.byCategory.saas >= 45, String(stats.byCategory.saas));
  check(
    "restaurant ≈50",
    stats.byCategory.restaurant >= 45,
    String(stats.byCategory.restaurant),
  );
  check(
    "portfolio ≈50",
    stats.byCategory.portfolio >= 45,
    String(stats.byCategory.portfolio),
  );
  check(
    "ecommerce ≈50",
    stats.byCategory.ecommerce >= 45,
    String(stats.byCategory.ecommerce),
  );
  const counts = countTemplatesByCategory();
  check("countTemplatesByCategory total matches", counts.total === stats.total);

  const engineBakery = searchTemplates(
    "Brooklyn bakery called Rye & Salt — sourdough, pastries, wholesale",
    { limit: 3 },
  );
  check(
    "engine matches bakery industry",
    engineBakery.industry === "bakery",
    engineBakery.industry,
  );
  const mixed = mixTemplates(
    "luxury boutique hotel in Lisbon with warm editorial feel",
    {},
  );
  check("mix returns a template", Boolean(mixed?.sections.length));
  const applied = applyTemplateEngine(
    "B2B SaaS analytics platform with subscription pricing",
  );
  check(
    "apply injects copy patterns",
    applied.blueprint.copyPatterns.headline.length > 0,
  );
  check(
    "applied sections validate",
    validateStructure(applied.blueprint.sections) === null,
  );

  console.log("\nKnowledge base retrieval");
  const bakery = retrieveTemplates(
    "Brooklyn bakery called Rye & Salt — sourdough, pastries, wholesale",
  );
  check("bakery brief matches bakery template", bakery.industry === "bakery");
  check(
    "bakery retrieval is high or medium confidence",
    bakery.confidence === "high" || bakery.confidence === "medium",
    bakery.confidence,
  );
  check(
    "bakery template sections validate",
    validateStructure(bakery.matches[0]!.template.sections) === null,
    validateStructure(bakery.matches[0]!.template.sections) || undefined,
  );

  const saas = retrieveTemplates(
    "B2B SaaS analytics platform with subscription pricing for product teams",
  );
  check(
    "saas brief matches saas-family industry",
    saas.industry === "saas" ||
      saas.industry === "analytics" ||
      saas.matches[0]?.template.sections.includes("pricing_3tier") === true,
    saas.industry,
  );
  check(
    "saas template includes pricing",
    saas.matches[0]!.template.sections.includes("pricing_3tier"),
  );

  const dental = retrieveTemplates(
    "Family dental clinic in Austin offering cleanings and Invisalign",
  );
  check("dental brief matches dental", dental.industry === "dental");

  const vagueKb = retrieveTemplates("make a nice website please");
  check(
    "vague brief has low confidence or general industry",
    vagueKb.confidence === "low" || vagueKb.industry === "general",
  );

  console.log("\nManager transitions");
  const baseState = (over: Partial<ManagerState>): ManagerState => ({
    mode: "generate",
    plan: null,
    blueprint: null,
    developed: false,
    reviewPassed: null,
    scoreBelowThreshold: false,
    fixAttempts: 0,
    maxFixAttempts: 2,
    llmCallsUsed: 0,
    llmCallsMax: 6,
    wantsDesign: true,
    ...over,
  });
  check(
    "manager starts with plan",
    decideNextStep(baseState({})).step === "plan",
  );
  check(
    "manager designs after plan",
    decideNextStep(
      baseState({
        plan: planFromBrief(PROMPT),
        wantsDesign: true,
      }),
    ).step === "design",
  );
  const bp = blueprintFromTemplates(PROMPT);
  check(
    "manager develops after blueprint",
    decideNextStep(
      baseState({
        plan: planFromBrief(PROMPT),
        blueprint: bp,
        wantsDesign: true,
      }),
    ).step === "develop",
  );
  check(
    "manager fixes when design score is low",
    decideNextStep(
      baseState({
        plan: planFromBrief(PROMPT),
        blueprint: bp,
        developed: true,
        reviewPassed: true,
        scoreBelowThreshold: true,
      }),
    ).step === "fix",
  );
  check(
    "manager reviews after develop",
    decideNextStep(
      baseState({
        plan: planFromBrief(PROMPT),
        blueprint: bp,
        developed: true,
      }),
    ).step === "review",
  );
  check(
    "manager fixes on failed review",
    decideNextStep(
      baseState({
        plan: planFromBrief(PROMPT),
        blueprint: bp,
        developed: true,
        reviewPassed: false,
        fixAttempts: 0,
      }),
    ).step === "fix",
  );
  check(
    "manager done when review passes",
    decideNextStep(
      baseState({
        plan: planFromBrief(PROMPT),
        blueprint: bp,
        developed: true,
        reviewPassed: true,
      }),
    ).step === "done",
  );
  check(
    "manager done when fix budget exhausted",
    decideNextStep(
      baseState({
        plan: planFromBrief(PROMPT),
        blueprint: bp,
        developed: true,
        reviewPassed: false,
        fixAttempts: 2,
        maxFixAttempts: 2,
      }),
    ).step === "done",
  );
  check(
    "refine skips design unless regenerate",
    decideNextStep(
      baseState({
        mode: "refine",
        plan: {
          intent: "patch",
          summary: "patch",
          targets: [],
          steps: [],
          confidence: "high",
          source: "deterministic",
        },
        wantsDesign: false,
      }),
    ).step === "develop",
  );

  console.log("\nDesigner (deterministic)");
  const designerBp = await runDesigner({
    brief: PROMPT,
    ctx: { provider: "demo", budget: newLlmBudget(6) },
  });
  check("designer uses boutique/florist template", designerBp.industry === "boutique");
  check("designer source is deterministic", designerBp.source === "deterministic");
  check(
    "designer sections validate",
    validateStructure(designerBp.sections) === null,
  );
  check(
    "designer emits design tokens",
    Boolean(designerBp.design.accent || designerBp.design.buttonBg),
  );
  check(
    "generate planner references template",
    (planFromBrief(PROMPT).templateIds?.length || 0) > 0,
  );

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

  const bigger = resolveTargets(memory, "make the button bigger");
  check(
    "button size maps to buttonSize token",
    bigger.targets.some(
      (t) =>
        (t.kind === "design_token" || t.kind === "section_token") &&
        t.token === "buttonSize" &&
        t.value === "large",
    ),
    JSON.stringify(bigger.targets[0]),
  );

  const darker = resolveTargets(memory, "make the footer darker");
  check(
    "darker section maps to surface token",
    darker.targets[0]?.kind === "section_token" &&
      darker.targets[0].token === "surface",
    JSON.stringify(darker.targets[0]),
  );

  const addPricing = resolveTargets(memory, "add pricing");
  check(
    "add pricing resolves to add_section",
    addPricing.targets.some(
      (t) => t.kind === "add_section" && t.sectionId === "pricing_3tier",
    ),
    JSON.stringify(addPricing.targets[0]),
  );

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
  check(
    "review includes design score 0–100",
    typeof clean.score === "number" && clean.score >= 0 && clean.score <= 100,
    String(clean.score),
  );
  const withSeo = ensureSeo({ ...base, seo: undefined });
  check("ensureSeo fills title", Boolean(withSeo.seo?.title));
  check("ensureSeo fills description", Boolean(withSeo.seo?.description));

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
    "manager, planner and reviewer all emitted events",
    run.events.some((e) => e.role === "manager") &&
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

  console.log("\nOrchestrator generate (demo, manager → designer path)");
  const generated = await runAgentLoop({
    mode: "generate",
    request: PROMPT,
    provider: "demo",
  });
  check("generate run spends zero model calls", generated.llmCalls === 0);
  check("generate run passes review", generated.passed, JSON.stringify(generated.review.issues.slice(0, 2)));
  check(
    "generate emits designer events",
    generated.events.some((e) => e.role === "designer"),
  );
  check(
    "generate produces a blueprint",
    Boolean(generated.blueprint?.industry),
    generated.blueprint?.industry,
  );
  check(
    "generate applies blueprint design tokens",
    Boolean(generated.spec.design?.buttonBg || generated.spec.design?.accent),
    JSON.stringify(generated.spec.design),
  );

  console.log("\nWebsite DNA + Magic Blueprint + Magic Score");
  const { matchWebsiteDna, listWebsiteDna } = await import("@/lib/dna");
  const { buildMagicBlueprint } = await import("@/lib/blueprint");
  const { expandPromptToExpertBrief } = await import("@/lib/prompt");
  const { computeMagicScore } = await import("@/lib/magic-score");
  const { generateDesignSystem } = await import("@/lib/design-system");
  const { auditWebsite } = await import("@/lib/doctor");

  check("DNA library has ≥8 industries", listWebsiteDna().length >= 8);
  const coffeeDna = matchWebsiteDna("Northbeam Coffee cafe with subscription");
  check("DNA matches coffee", coffeeDna.dna.id === "coffee", coffeeDna.dna.id);
  const saasDna = matchWebsiteDna("B2B analytics SaaS with free trial");
  check("DNA matches saas", saasDna.dna.id === "saas", saasDna.dna.id);

  const expanded = expandPromptToExpertBrief({
    idea: "Northbeam Coffee in Portland — walk-ins and wholesale",
  });
  check(
    "prompt expander produces expert brief",
    expanded.expandedBrief.includes("Industry:") &&
      expanded.expandedBrief.includes("Primary CTAs:"),
  );

  const magic = buildMagicBlueprint({
    brief:
      "Business: Northbeam Coffee\nIndustry: Coffee\nGoal: Attract walk-ins\nTarget: Remote workers\nStyle: minimal",
    websiteType: "business",
  });
  check("blueprint has business analysis", Boolean(magic.businessAnalysis.positioning));
  check(
    "blueprint has customer strategy",
    magic.customerStrategy.desires.length >= 2,
  );
  check(
    "blueprint website structure includes why",
    magic.websiteStructure.every((s) => s.why.length > 8),
  );
  check("blueprint has design plan tokens", Boolean(magic.designPlan.tokens.primary));
  check(
    "blueprint debate has 4 personas",
    magic.debate.opinions.length === 4,
  );
  check(
    "blueprint manager decision sets CTA",
    Boolean(magic.debate.managerDecision.ctaStrength),
  );

  const ds = generateDesignSystem({ dna: coffeeDna.dna, style: "minimal" });
  check("design system zod-valid colors", /^#/.test(ds.colors.primary));

  const scored = computeMagicScore(generated.spec, generated.review.issues, {
    html: generated.html,
    brief: PROMPT,
  });
  check(
    "magic score has conversion + a11y",
    typeof scored.scores.conversion === "number" &&
      typeof scored.scores.accessibility === "number",
  );
  check("magic score overall 0–100", scored.scores.overall >= 0 && scored.scores.overall <= 100);

  const doctor = await auditWebsite({
    htmlHint: `<html><head><title>Acme Cafe</title><meta name="description" content="Fresh coffee and pastry in downtown."/></head><body><h1>Acme Cafe</h1><h2>Menu</h2><a href="/order">Order online</a><p>Trusted by locals.</p></body></html>`,
  });
  check("doctor returns scores", doctor.scores.overall > 0);
  check("doctor fix brief is non-empty", doctor.fixBrief.length > 40);

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
