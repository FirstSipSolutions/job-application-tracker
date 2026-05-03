# src/ — what's in here

| Folder         | What's in it                                               |
| -------------- | ---------------------------------------------------------- |
| `pages/`       | One file per screen. Each = one URL the user visits.       |
| `components/`  | Reusable parts that pages assemble together.               |
| `hooks/`       | Data + state (Supabase queries go here when wired up).     |
| `context/`     | React context — ThemeContext (dark/light) lives here.      |
| `lib/`         | Third-party setup — Supabase client (`supabase.js`).       |
| `styles/`      | CSS — one file per page/feature + `theme.css` for tokens.  |

## Pages

| File              | URL                            | What it is                        |
| ----------------- | ------------------------------ | --------------------------------- |
| `Landing.jsx`     | `/`                            | Public landing page               |
| `Login.jsx`       | `/login`                       | Sign in                           |
| `Signup.jsx`      | `/signup`                      | Create account                    |
| `Dashboard.jsx`   | `/app`                         | Applications list + pipeline chart|
| `CalendarPage.jsx`| `/app/calendar`                | Interview + follow-up calendar    |
| `RoleView.jsx`    | `/app/role/:roleId`            | Kanban board for one role         |
| `JobDetailPage.jsx`| `/app/role/:roleId/job/:jobId`| Single job application detail     |

## Components

```
components/
├── ui/         AddApplicationModal, ThemeToggle
├── effects/    Aurora (used by Login)
├── layout/     AppLayout, Sidebar
└── kanban/     KanbanBoard, KanbanColumn, JobCard
└── role-and-job/ RoleCard, JobForm, JobDetail
```

## Hooks

| File              | Status     | What it does                        |
| ----------------- | ---------- | ----------------------------------- |
| `useAuth.js`      | live       | Current Supabase session            |
| `useRoles.js`     | stub       | User's role cards — wire to Supabase|
| `useJobs.js`      | stub       | Jobs under a role — wire to Supabase|

## How a feature flows

1. URL → `App.jsx` picks the matching `pages/` file
2. Page calls a hook to get data
3. Page renders components with that data
4. Components are dumb — they only show what they're given
