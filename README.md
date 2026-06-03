
<<<<<<< Updated upstream
V2 rebuild — frontend-only (React + Vite), Supabase for database and auth.

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
VITE_GROQ_API_KEY=
```

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
=======
# Job Application Tracker 
### This is currently an open MVP

A full-stack job application tracker built to manage and visualize a job search pipeline. Designed and shipped as a collaborative team project under First Sip Solutions.

**Live:** [https://first-sip-application-tracker.netlify.app/](https://first-sip-application-tracker.netlify.app/)  
**Org:** [https://github.com/FirstSipSolutions](https://github.com/FirstSipSolutions)

---

## Tech Stack

- **Frontend:** React + Vite, deployed on Netlify
- **Backend:** Node.js + Express v5, deployed on Render
- **Database:** PostgreSQL hosted on Supabase
- **Validation:** Zod
- **Styling:** Pure CSS, glass morphism aesthetic

---

## Features

- Log job applications with company, title, URL, date, and notes
- Track status across six stages: Draft, Applied, Interviewing, Offered, Rejected, Withdrawn
- Breakdown sidebar with live counts and progress bars
- Recent applications activity feed
- Search and filter by status
- Delete with confirmation guard
- Form modal with URL auto-prefix

  
## Structure
```
job-application-tracker/
├── backend/
│   ├── docs/
│   ├── node_modules/
│   ├── src/
│   ├── .env
│   ├── package-lock.json
│   ├── package.json
│   ├── schema.sql
│   └── server.js
├── frontend/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   └── vite.config.js
├── node_modules/
├── .gitignore
├── package-lock.json
├── package.json
├── README.md
└── server.js
```
## Team & Development Philosophy

This project was built using **vertical feature slices**. Rather than splitting strictly by frontend and backend, development responsibilities were divided by feature ownership—handling everything from database schema and API endpoints to UI implementation for a specific slice of the app.

- **Feature Slice A:** Focused on the "Create" and "Read" lifecycle, including data ingestion forms, dashboard visualization, and the initial deployment pipeline across Supabase, Render, and Netlify.
- **Feature Slice B:** Focused on the "Update" and "Delete" lifecycle, implementing the state management for editing records, status transitions, and data persistence logic.

The team maintained a lightweight standup structure to sync on integration points and review peer PRs. This approach ensured that all contributors understood the full stack while maintaining high velocity and clear ownership of features.

---

## Project Management

Tracked via **GitHub Projects**.

- **Backlog** — planned, not yet started
- **Ready** — scoped and assigned
- **In Progress** — actively being built
- **In Review** — PR open, awaiting approval
- **Done** — merged and closed

### Workflow

1. Create an Issue before writing any code
2. Assign and move to Ready
3. Create a branch — `feat/`, `fix/`, or `chore/`
4. Open a PR linked with `Closes #[issue number]`
5. Peer review and approval required
6. Merge into `development` — `development` merges into `main` on release

---

## Phase 1 Backlog

- Auth — JWT/sessions, per-user data isolation
- TypeScript migration
- Email reminders for follow-ups
- Analytics dashboard
- Chrome extension to scrape job postings
- AWS migration — RDS, Elastic Beanstalk, CloudFront
>>>>>>> Stashed changes
