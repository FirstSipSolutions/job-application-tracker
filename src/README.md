# `src/` — what's in here

This folder is the whole app. Here's where to find what you need.

## The map

| Folder       | What's in it                                              |
| ------------ | --------------------------------------------------------- |
| `pages/`     | One file per screen. Each = one URL the user visits.      |
| `components/`| Reusable parts that pages assemble together.              |
| `hooks/`     | Reusable data fetchers (e.g. `useRoles()` returns roles). |
| `data/`      | Fake demo data (used until Supabase is wired up).         |
| `lib/`       | Third-party SDK setup (Supabase client lives here).       |
| `styles/`    | Global CSS — `index.css`, `aurora.css`.                   |
| `App.jsx`    | The route table — "what URL shows what page."             |
| `main.jsx`   | Entry point. You almost never touch this.                 |

## Pages (the screens)

| File                | URL                              | What it is                               |
| ------------------- | -------------------------------- | ---------------------------------------- |
| `Landing.jsx`       | `/`                              | Marketing landing page (public)          |
| `Login.jsx`         | `/login`                         | Sign-in screen (public)                  |
| `Dashboard.jsx`     | `/app`                           | User's role cards + create button        |
| `RoleView.jsx`      | `/app/role/:roleId`              | Kanban board for one role                |
| `JobDetailPage.jsx` | `/app/role/:roleId/job/:jobId`   | Single job application detail            |

## Components (broken into 4 buckets)

```
components/
├── ui/             reusable primitives  → Button, Modal, Input, Badge
├── effects/        visual effects       → Aurora (background)
├── layout/         page chrome          → Navbar, Sidebar, PageWrapper
├── kanban/         the kanban board     → KanbanBoard, KanbanColumn, JobCard
└── role-and-job/   feature components   → RoleCard, JobForm, JobDetail, NotificationBell
```

**When deciding where a new component goes:**
- Is it a button / modal / input / label any screen would use? → `ui/`
- Is it a visual effect (background, animation, decoration)? → `effects/`
- Is it the page frame (top bar, side menu, wrapper)? → `layout/`
- Is it part of the kanban board? → `kanban/`
- Is it tied to a role or a job (cards, forms, details)? → `role-and-job/`

## Hooks (data + state)

| File                     | What it does                                              |
| ------------------------ | --------------------------------------------------------- |
| `useAuth.js`             | Returns the current user (from Supabase, eventually).     |
| `useRoles.js`            | Returns the user's role cards.                            |
| `useJobs.js`             | Returns job applications under a role.                    |
| `useNotifications.js`    | Returns the user's notifications.                         |

## How a feature flows

1. Someone visits a URL → React Router (`App.jsx`) picks the matching `pages/` file.
2. The page calls a hook (e.g. `useRoles()`) to get its data.
3. The page renders components (`<RoleCard />`, `<KanbanBoard />`, etc.) with that data.
4. Components are dumb — they just show what they're given.

That's the whole shape. Pages are the assembly; components are the parts; hooks are the data; data flows down through props.

## What's NOT in here yet (by design)

- **No real auth** — `useAuth()` returns a placeholder. Will hook into Supabase later.
- **No real persistence** — every component will use `data/demoData.js` until Supabase is wired.
- **No styling system locked in** — Tailwind was removed; use plain CSS in `styles/` or inline styles for now.

## First time touching this repo? See `STARTER-TASKS.md` at the root.
