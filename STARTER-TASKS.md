# Starter tasks

Pick any of these and go. They're independent — no two tasks touch the same file. Aimed at building familiarity with the codebase, not at shipping features.

If you finish one, mark it done by deleting it from this file and committing.

---

## Easy (5–15 min each)

- [ ] **Change the project name** — open `src/pages/Landing.jsx`, find the `<h1>` that says `App<span>Track</span>`, change to whatever name we settle on.
- [ ] **Update the tagline** — same file, the `<p>` right after the H1. Currently says "Your job hunt, organized." Try a few alternatives.
- [ ] **Edit the feature bullets** — same file, find `<Section title="Features">`. Add, remove, or reword bullets.
- [ ] **Edit the "How it works" steps** — same file, the next section.
- [ ] **Change the footer line** — same file, near the bottom: "First Sip Solutions · 2026".
- [ ] **Try a different aurora color** — open `src/pages/Landing.jsx`, find `colorStops={["#0a2a3a", "#0d6e8a", "#1a3a4a"]}` and try other hex codes. Save and watch it shift.

## Medium (30–60 min each)

- [ ] **Build out the Login page UI** — open `src/pages/Login.jsx`. It just shows `<h1>Login</h1>` right now. Add an email + password form. No real auth wiring yet — just the form structure. Style it like the Landing card (glass panel, copper accent).
- [ ] **Build out the Dashboard placeholder** — open `src/pages/Dashboard.jsx`. Render a heading, a `+ New Role` button, and a grid placeholder. Use `RoleCard` from `src/components/role-and-job/RoleCard.jsx` (it currently just renders the word "RoleCard" — that's fine for now).
- [ ] **Sketch the RoleCard component** — open `src/components/role-and-job/RoleCard.jsx`. Replace the placeholder with a card that shows: role title, count of jobs in it, count by status. Use fake props for now.
- [ ] **Add a Signup page** — create `src/pages/Signup.jsx` with a form. Then register the route in `src/App.jsx` for `/signup`.

## Stretch (1–3 hr each)

- [ ] **Create the demo data file** — make `src/data/demoData.js` exporting two roles with several jobs each. Match the shape we agreed in standup.
- [ ] **Wire `useRoles()` to demo data** — open `src/hooks/useRoles.js` and have it return the demo roles instead of an empty array.
- [ ] **Render real role cards on the dashboard** — Dashboard calls `useRoles()`, maps the result to `<RoleCard />` components.
- [ ] **Make role cards clickable** — wrap each `<RoleCard />` in a `<Link to={`/app/role/${role.id}`} />` so clicking navigates to the role's page.

---

**Rule:** if a task feels too big or unclear, talk it through in the next standup before starting. Don't guess the spec.
