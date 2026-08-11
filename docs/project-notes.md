# Project Notes

Working notes so context survives across machines and restarts.

## Deployment (important)

- **Production runs on Cloudflare Pages**, not Netlify. Netlify was removed. The
  `functions/api/` folder is Cloudflare Pages Functions and only runs on
  Cloudflare.
- Prod URL: `https://job-application-tracker-1up.pages.dev`
- `main` is the production branch. Cloudflare auto-deploys on merge (~40s).
- Env changes only take effect on a **new deploy** - after editing variables,
  redeploy.

## Environment variables

Local dev uses `.env.local` (gitignored). Production uses the Cloudflare Pages
project settings (Variables and Secrets). They are separate - a key in
`.env.local` does nothing in production until also set in Cloudflare.

```
VITE_SUPABASE_URL=        # public, client-side
VITE_SUPABASE_ANON_KEY=   # public, client-side (safe, protected by RLS)
GROQ_API_KEY=             # secret, server-side only
ADZUNA_APP_ID=            # secret, server-side only
ADZUNA_APP_KEY=           # secret, server-side only
```

Set the three secrets in Cloudflare as **Secret** (encrypted), no `VITE_` prefix.

## Things that were fixed (root causes)

- **Groq classification returned 503 in prod** - `GROQ_API_KEY` was only in
  `.env.local`, never added to Cloudflare. Fixed by adding it in Cloudflare +
  redeploy.
- **Groq then returned 502** - the model `llama-3.1-8b-instant` was deprecated.
  Switched to `openai/gpt-oss-20b`. That model is a reasoning model, so it needs
  `reasoning_effort: "low"` and a larger `max_tokens` or it returns empty content.
- **0-2 (entry level) was empty** - without Groq, the filter required the literal
  word "junior" in the title. Changed so any non-senior role shows under 0-2.
- **Feed diversity** - a few large employers (Affirm, Canonical, Grafana)
  dominate because they post the most remote dev roles. Per-company cap is 2.
- **Adzuna** - queries are remote-scoped on the Canada endpoint; this is the main
  aggregator volume source.
- **Hacker News "Who is Hiring"** added as a source for company variety
  (`src/lib/jobs/sources/hackernews/`). No API key. Freshest at the start of each
  month when the thread is posted.
- **Freshness window** - `MAX_AGE_DAYS` in `src/lib/jobs/filter.js`. Tuning this
  trades freshness against volume; it is not the fix for diversity.

## Resume delete bug (Supabase RLS)

Deleting a resume did not persist - it reappeared on reload. Cause: the `resumes`
table was missing a Row-Level Security **DELETE** policy, and the delete error was
ignored. The code now checks the error and rolls the card back if the delete
fails. The real fix is to run the RLS policies in Supabase (see `supabase/schema.sql`,
resumes section), including the storage bucket delete policy.

## Supabase auth / password reset

- There is **no user table in the `public` schema**. Auth users live in the
  protected `auth.users` table.
- To view: Table Editor -> schema dropdown (top-left) -> `auth` -> `users`.
  Passwords are hashed; they cannot be set from the table.
- To reset a password (personal or test account): Dashboard -> Authentication ->
  Users -> find the email -> row menu (...) -> Send password recovery, or Reset
  password to set one directly.

## Quantified stats (for resume, measured from the codebase)

- 16 external job sources integrated
- 121 company career boards queried (Greenhouse 58, Ashby 36, Canadian 17,
  Lever 5, Workday 5)
- ~10,000 raw postings processed per refresh, filtered to ~100-150 roles
- 33 React components across 8 routes
- 3 Supabase / Postgres tables (`applications`, `events`, `resumes`)
- Stack is 100% JavaScript / JSX - **no TypeScript** (do not claim TypeScript on
  the resume unless the project is migrated first)
