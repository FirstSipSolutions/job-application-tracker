# Job Application Tracker

Find remote, Canada-eligible tech jobs and track applications through to offer.
Frontend-only React + Vite app backed by Supabase, with an AI layer that
filters and ranks listings pulled from a dozen job boards.

**Live:** https://first-sip-application-tracker.netlify.app/
**Org:** https://github.com/FirstSipSolutions

## What it does

- Pulls listings from 13 job sources (Greenhouse, Ashby, Workday, Job Bank, and more)
- Filters to remote, tech, Canada-eligible roles and ranks the most hirable first
- Uses Groq to classify each posting (stack, seniority, Canada eligibility, salary)
- Tracks applications, resumes, cover letters, and interviews on a dashboard

## How the job feed works

The feed is a pipeline. Each stage does one job:

1. **Ingest** - `src/lib/jobs/sources/` adapters fetch each board and `normalize.js` maps them to one shape.
2. **Pre-filter** - `filter.js` runs a cheap regex gate (remote / tech / fresh / Canada) so the model only ever sees real candidates.
3. **Classify** - `functions/api/classify.js` calls Groq behind the server so the key never ships to the browser; `src/lib/llm/classifyJobs.js` chunks, caches, and fails open.
4. **Learn** - `companyMemory.js` remembers what I click Apply on and lets that outrank the model next time.
5. **Rank** - listings are scored by source confidence, seniority fit, and recency.

## Setup

```sh
npm install
npm run dev
```

Create `.env.local`:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
GROQ_API_KEY=
```

`GROQ_API_KEY` is server-side only. It is read by `/api/classify` (Cloudflare
Pages in prod, Vite middleware in dev) and never bundled into the client, so
do not prefix it with `VITE_`.

## Testing

```sh
npm test          # run once
npm run test:watch
```

Vitest + React Testing Library. Tests live next to the code they cover
(`*.test.js`).

## Stack

React 19 + Vite, React Router, Supabase (DB + Auth), Groq (classification),
Recharts, dnd-kit, motion, custom CSS.

## Data structures in practice

See [`docs/dsa.md`](docs/dsa.md) for full write-ups.

- **Hash map** - `src/hooks/useResumes.js` - resume stats built in one O(N) pass, read O(1) per card.
- **Set** - `src/context/EventsContext.jsx` - O(1) dismissed-event lookups on every render.
- **Set** - `src/components/modals/AddApplicationModal.jsx` - O(1) subdomain/path lookups to pull a company name from any job URL.
