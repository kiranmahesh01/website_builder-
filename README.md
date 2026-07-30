# Magic AI

Free chat-to-build website builder inspired by Wegic AI. Describe a site → Magic AI outputs **structured site JSON** (pages + typed sections) → React **SiteRenderer** → preview & publish.

> **Magic AI itself is free.** You only pay your own LLM provider (OpenRouter/OpenAI/Gemini) if you use real models — or use **Demo** with no key. Cursor is not an AI provider for live generation.

## Architecture

```
prompt → LLM (JSON matching src/lib/schema.ts)
       → Zod validate
       → SiteRenderer (src/components/sections/*)
       → HTML string stored in Project.html
       → JSON stored in Project.data
       → Builder iframe preview + /s/[slug] publish
```

Legacy / failed-JSON responses still fall back to raw HTML so older projects keep working.

## Features

- Schema-driven multi-page sites (`Website` → `pages[]` → typed sections)
- Section library: nav, hero, features, about, gallery, pricing, testimonials, faq, cta, contact, products, footer
- LLM providers: **Demo** (no key), OpenRouter (Gemma), OpenAI, Gemini, Bytez
- Auth, dashboard, chat refine, one-click publish to `/s/[slug]`

## Setup

```bash
npm install
cp .env.example .env
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment keys

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="any-long-random-string"
AUTH_URL="http://localhost:3000"

# LLM — pick at least one for real AI (or leave demo as default)
OPENROUTER_API_KEY=
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=
BYTEZ_API_KEY=
OPENROUTER_MODEL="google/gemma-3-4b-it"
DEFAULT_LLM_PROVIDER="demo"

# Optional public tunnel (not an LLM key)
NGROK_AUTHTOKEN=
```

## Curl test (`/api/generate`)

`/api/generate` requires a signed-in session cookie. Easiest path: **Demo provider** after signup + Auth.js credentials login.

```bash
# 0) App must be running on :3000
BASE=http://localhost:3000
EMAIL="demo-$(date +%s)@example.com"
PASS="testpass123"
COOKIE_JAR=/tmp/magic-ai-cookies.txt

# 1) Sign up
curl -sS -X POST "$BASE/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Curl Tester\",\"email\":\"$EMAIL\",\"password\":\"$PASS\"}"

# 2) Get CSRF + sign in (Auth.js credentials)
CSRF=$(curl -sS -c "$COOKIE_JAR" "$BASE/api/auth/csrf" | python3 -c "import sys,json; print(json.load(sys.stdin)['csrfToken'])")

curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$BASE/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=$CSRF&email=$EMAIL&password=$PASS&redirect=false&json=true"

# 3) Generate (schema-driven site via Demo — no LLM key needed)
curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$BASE/api/generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Online orchid boutique with shop and pickup","provider":"demo"}' \
  | python3 -m json.tool | head -n 40
```

You should see `project.html` (rendered document) and `project.data` (structured Website JSON). Without a session cookie, the same endpoint returns `401 Unauthorized`.

With OpenRouter configured, swap `"provider":"openrouter"` (and set `OPENROUTER_API_KEY` in `.env`, then restart).

## Usage

1. Sign up at `/signup`
2. Enter a brief (e.g. “Online orchid boutique with shop and pickup”)
3. Magic AI generates structured sections → rendered preview
4. Chat to refine (“add pricing”, “make the hero darker”)
5. **Publish** → `/s/your-slug`

## Honest note on design quality

Twelve section types are enough for a solid MVP, but **sites will start to look similar** if every niche reuses the same layouts. Visual quality scales with (1) stronger theme/copy from the model, (2) more section *variants* / layouts, and (3) niche-specific art direction — not just more section type names.

## Stack

- Next.js (App Router) + TypeScript + Tailwind (app chrome)
- Prisma + SQLite (`Project.html` + `Project.data` Json)
- Auth.js credentials
- Zod schema contract + React section library
- OpenAI SDK (OpenAI / Bytez / OpenRouter) + Google Generative AI
