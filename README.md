# Job Application Tracker

Track job applications from search to offer. React + Vite, Supabase for auth and data,
with an AI layer that filters and ranks remote job listings.

**Live:** https://first-sip-application-tracker.netlify.app/

## Run

```sh
npm install
npm run dev
```

`.env.local`:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
GROQ_API_KEY=
```

`GROQ_API_KEY` stays server-side (used by `/api/classify`), so no `VITE_` prefix.

## AI usage (free)

The only AI call is job classification via Groq (`llama-3.1-8b-instant`, free tier).
It is built to stay free:

- Runs only after a cheap regex pre-filter, so the model sees only real candidates
- Results cached 7 days per job, so repeat visits cost 0 tokens
- Small chunks and trimmed descriptions to stay under free-tier limits
- Stops on rate limit (429) and falls back to regex; nothing breaks
- With no key set, classification is skipped entirely (regex only)

Groq's free tier is rate-limited, not billed, so it cannot charge unless a paid
plan is added. Watch usage at https://console.groq.com (Usage / Limits).

## Test

```sh
npm test
```

## Structure

```
src/
  pages/         one file per route
  components/     UI grouped by area (jobs, dashboard, modals, layout)
  hooks/          data hooks (useJobFeed, useApplications, useResumes)
  context/        app-wide state (theme, profile, events)
  lib/jobs/       the job feed: sources, normalize, filter, score, memory
  lib/llm/        AI classification client
functions/api/   serverless: Groq classify + source proxies
```
```
