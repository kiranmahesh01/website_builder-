#!/usr/bin/env node
/**
 * Expose the local Next.js app via ngrok.
 * Requires NGROK_AUTHTOKEN in .env. Does not generate websites — LLM keys are separate.
 *
 * Usage: npm run tunnel
 * (run `npm run dev` in another terminal first)
 */
import { config } from "dotenv";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: join(root, ".env") });

const token = process.env.NGROK_AUTHTOKEN?.trim();
if (!token) {
  console.error(
    "NGROK_AUTHTOKEN is not set in .env.\n" +
      "Add your ngrok auth token, then re-run: npm run tunnel",
  );
  process.exit(1);
}

const port = process.env.PORT || "3000";
console.log(`Starting ngrok tunnel → http://localhost:${port}`);
console.log(
  "Keep `npm run dev` running. Published sites stay at /s/[slug]; ngrok exposes the whole app.",
);

const child = spawn("npx", ["--yes", "ngrok", "http", port], {
  stdio: "inherit",
  cwd: root,
  env: { ...process.env, NGROK_AUTHTOKEN: token },
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
