# Job Application Tracker

**Live (v1):** https://first-sip-application-tracker.netlify.app/
**Org:** https://github.com/FirstSipSolutions


## Stack

- React 19 + Vite
- React Router
- Supabase (DB + Auth)
- Custom CSS
- motion (animations)
- Groq AI (job classification)
- Recharts (dashboard charts)
- dnd-kit (drag and drop)

## DSA in Practice

See [`docs/dsa.md`](docs/dsa.md) for full explanations with code samples.

**Hash Map** — `src/hooks/useResumes.js` — resume stats aggregated in O(N), read in O(1) per card instead of O(N*M) naive filtering.

**Set (dismissed events)** — `src/context/EventsContext.jsx` — O(1) membership check on every panel render instead of O(N) array scan.

**Set (URL pattern matching)** — `src/components/modals/AddApplicationModal.jsx` — O(1) subdomain and path lookups to extract company name from any job board URL.
