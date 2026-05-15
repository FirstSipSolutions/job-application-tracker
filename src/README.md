# src/

## Pages

| File              | URL                  | What it is                          |
| ----------------- | -------------------- | ----------------------------------- |
| `Landing.jsx`     | `/`                  | Public landing page                 |
| `Login.jsx`       | `/login`             | Sign in                             |
| `Signup.jsx`      | `/signup`            | Create account                      |
| `Dashboard.jsx`   | `/app`               | Main dashboard                      |
| `CalendarPage.jsx`| `/app/calendar`      | Interview and follow-up calendar    |
| `Settings.jsx`    | `/app/settings`      | Profile settings                    |
| `NotFound.jsx`    | `*`                  | 404 fallback page                   |

## Components

| Folder       | What's in it                                                        |
| ------------ | ------------------------------------------------------------------- |
| `dashboard/` | All dashboard components                                            |
| `layout/`    | AppNav, top nav bar present on every authenticated page            |
| `modals/`    | AddApplicationModal, AddEventModal, LogoutModal                     |
| `effects/`   | Aurora, animated gradient background used on landing and login     |
| `ui/`        | ThemeToggle                                                         |

### dashboard/

| File                    | What it does                                             |
| ----------------------- | -------------------------------------------------------- |
| `ActivityChart.jsx`     | Applications over time bar chart                        |
| `JobApplicationBoard.jsx` | Kanban-style application status board                 |
| `ProfileCard.jsx`       | User profile summary card                               |
| `ResumeBoard.jsx`       | CV Vault, upload, manage, and track resume versions    |
| `HireHub.jsx`           | Job board quick-links with custom link support          |
| `UpcomingPanel.jsx`     | Upcoming interviews and follow-ups (next 7 days)        |
| `WidgetGrid.jsx`        | Draggable stats widgets bar                             |

## Hooks

| File                 | What it does                                     |
| -------------------- | ------------------------------------------------ |
| `useApplications.js` | Applications CRUD, reads and writes to Supabase |
| `useResumes.js`      | CV Vault CRUD, resumes with usage stats         |
| `useAuth.js`         | Current Supabase auth session                    |

## Context

| File                | What it does                                                     |
| ------------------- | ---------------------------------------------------------------- |
| `ThemeContext.jsx`  | Dark / light mode toggle, persisted to localStorage             |
| `ProfileContext.jsx`| Display name and job title, synced to Supabase profiles table   |
| `EventsContext.jsx` | Calendar events + dismissed state (uses Set for O(1) lookup)    |

## Styles

| File            | Covers                                      |
| --------------- | ------------------------------------------- |
| `theme.css`     | CSS variables and design tokens             |
| `index.css`     | Global base styles and resets               |
| `dashboard.css` | Dashboard page and all dashboard components |
| `calendar.css`  | Calendar page                               |
| `landing.css`   | Landing page                                |
| `login.css`     | Login and signup pages                      |
