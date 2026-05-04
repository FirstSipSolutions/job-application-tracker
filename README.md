# Job Application Tracker

V2 rebuild — frontend-only (React + Vite), Supabase for database and auth.

**Live (v1):** https://first-sip-application-tracker.netlify.app/
**Org:** https://github.com/FirstSipSolutions

## Setup

```sh
npm install
npm run dev
```

Create `.env.local` with:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Stack

- React 19 + Vite
- React Router
- Supabase (DB + Auth)
- Tailwind CSS

## DSA in Practice

Real data structure decisions made in this codebase with complexity annotations.

**Hash Map** — `src/hooks/useResumes.js`
Resume stats (application count, response rate) are aggregated by building a hash map keyed by `resume_id` in a single O(N) pass. Each card then reads its stats in O(1). The alternative — filtering the full application array once per card — would be O(N*M) and degrades as users accumulate hundreds of applications.

**Set** — `src/context/EventsContext.jsx`
Dismissed events are stored in a `Set`. The upcoming panel calls `dismissed.has(key)` on every event during filtering. A Set gives O(1) lookup vs O(N) for an array scan.

## Backlog

- [ ] Toast notifications on all CRUD actions and auth errors
- [ ] 404 page + fallback route
- [ ] Event edit and delete (calendar events are currently add-only)
- [ ] Remove dead `onSubmit` prop from Login/Signup button components
