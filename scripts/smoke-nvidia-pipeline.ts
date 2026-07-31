/**
 * End-to-end check that the spec pipeline produces a real site through the
 * configured provider. Runs outside Next so it needs no auth or database.
 *
 *   npx tsx scripts/smoke-nvidia-pipeline.ts
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const { runSpecPipeline } = await import("../src/lib/spec/pipeline");
  const { resolveProvider } = await import("../src/lib/llm/types");

  const provider = resolveProvider(null);
  const prompt =
    "Brooklyn bakery called Rye & Salt — sourdough, pastries, wholesale orders, warm rustic style";

  console.log(`provider: ${provider}`);
  console.log(`model:    ${process.env.NVIDIA_MODEL}`);
  console.log(`prompt:   ${prompt}\n`);

  const started = Date.now();
  const result = await runSpecPipeline({ prompt, provider, theme: null });
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  const spec = result.spec;
  console.log(`completed in ${elapsed}s\n`);
  console.log(`brand:   ${spec.brand}`);
  console.log(`theme:   ${spec.theme}`);
  console.log(`seo:     ${spec.seo?.title}`);
  console.log(`pages:   ${spec.pages.length}`);

  for (const page of spec.pages) {
    console.log(`\n  /${page.slug} — ${page.title}`);
    for (const section of page.sections) {
      const content = section.content as Record<string, unknown>;
      const headline =
        (content.headline as string) ||
        (content.title as string) ||
        (content.eyebrow as string) ||
        "";
      console.log(`    ${section.id.padEnd(18)} ${headline.slice(0, 62)}`);
    }
  }

  // Did it actually use the brief, or fall back to generic demo copy?
  const text = JSON.stringify(spec).toLowerCase();
  const hits = ["rye", "salt", "sourdough", "pastr", "wholesale", "brooklyn"].filter(
    (w) => text.includes(w),
  );
  console.log(`\nbrief terms present: ${hits.join(", ") || "NONE"}`);
  console.log(
    hits.length >= 4
      ? "PASS — output is grounded in the brief."
      : "WEAK — output looks generic; the model may have fallen back to demo content.",
  );
}

main().catch((error) => {
  console.error("FAILED:", error instanceof Error ? error.message : error);
  process.exit(1);
});
