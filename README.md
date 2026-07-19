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
