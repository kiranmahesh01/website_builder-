/**
 * Eval loop: generate demo specs for all 30 prompts and report success.
 * Run: npx tsx scripts/eval-spec.ts
 */
import { EVAL_PROMPTS } from "../src/lib/spec/eval-prompts";
import { buildDemoSpec } from "../src/lib/spec/demo-spec";
import { specToWebsite } from "../src/lib/spec/to-website";

let ok = 0;
let fail = 0;

for (const prompt of EVAL_PROMPTS) {
  try {
    const spec = buildDemoSpec(prompt);
    const website = specToWebsite(spec);
    if (!website.pages[0]?.sections.length) throw new Error("empty");
    ok++;
    console.log(`✓ ${prompt.slice(0, 50)}…`);
  } catch (e) {
    fail++;
    console.log(`✗ ${prompt.slice(0, 50)}…`, e);
  }
}

console.log(`\n${ok}/${EVAL_PROMPTS.length} passed, ${fail} failed`);
