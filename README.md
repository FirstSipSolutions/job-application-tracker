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

See [`docs/dsa.md`](docs/dsa.md) for full explanations with code samples.

**Hash Map** — `src/hooks/useResumes.js` — resume stats aggregated in O(N), read in O(1) per card instead of O(N*M) naive filtering.

**Set (dismissed events)** — `src/context/EventsContext.jsx` — O(1) membership check on every panel render instead of O(N) array scan.

**Set (URL pattern matching)** — `src/components/modals/AddApplicationModal.jsx` — O(1) subdomain and path lookups to extract company name from any job board URL.

## Backlog

- [ ] Toast notifications on all CRUD actions and auth errors
- [x] 404 page + fallback route
- [ ] Event edit and delete (calendar events are currently add-only)
- [ ] Remove dead `onSubmit` prop from Login/Signup button components
