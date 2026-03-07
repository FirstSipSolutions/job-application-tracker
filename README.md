# Job Application Tracker

## Overview
A lean, full-stack application designed to organize and track job applications and interview statuses. This project prioritizes a fast, functional Minimum Viable Product (MVP) over premature optimization, using a single-table database architecture to ship quickly.

The initial repository structure, database schema, and server boilerplate were scaffolded using AI to establish a standardized baseline and accelerate development.

## Tech Stack
* **Frontend:** React (Vite)
* **Backend:** Node.js + Express
* **Database:** PostgreSQL
* **Deployment:** Render or Railway (MVP) → AWS (Phase 2)

---

## Project Management
Tracked via **GitHub Projects (Team Planning board)**.

- **Backlog** — all planned and future tickets not yet in active development
- **Ready** — scoped, assigned, and ready to pick up
- **In Progress** — actively being built
- **In Review** — PR open, awaiting approval
- **Done** — merged and closed

### Workflow
1. Create an Issue for every piece of work before any code is written
2. Assign the Issue to a developer and move it to **Ready**
3. Developer creates a branch using the naming convention below
4. Developer opens a PR linked to the Issue using `Closes #[issue number]`
5. Move Issue to **In Review** — other dev reviews and approves
6. Merge PR → Issue closes automatically → **Done**

### Branch Naming
- `feat/short-description` → new feature
- `fix/short-description` → bug fix
- `chore/short-description` → config, setup, cleanup

### Rules
- No direct commits to `main` or `dev`
- Every PR requires one approval before merging
- PRs merge into `dev` — only `dev` merges into `main` on releases

---

## Workflow & Task Delegation
To maintain high velocity and avoid integration bottlenecks, development is divided into **vertical feature slices**. Both developers work across the database, API, and UI for their specific features.

### Phase 0: Foundation (Completed)
* AI-assisted scaffolding of the frontend (React/Vite) and backend (Node/Express) directories
* Generation of the `applications` PostgreSQL schema
* Establishment of the baseline API request/response contracts

### Developer A: The "Create & Read" Slice
*Focus: Data ingestion and primary display.*
- [ ] **DB/API:** Build `POST /api/applications` to accept new entries
- [ ] **DB/API:** Build `GET /api/applications` to retrieve all entries
- [ ] **UI:** Build the "Add Application" form component and wire it to the POST route
- [ ] **UI:** Build the main Dashboard table component to fetch and map the GET data

### Developer B: The "Update & Delete" Slice
*Focus: State mutation and data management.*
- [ ] **DB/API:** Build `PUT /api/applications/:id` to handle status changes and note updates
- [ ] **DB/API:** Build `DELETE /api/applications/:id` to remove entries
- [ ] **UI:** Add an inline status dropdown to the Dashboard table to trigger the PUT route
- [ ] **UI:** Build an "Edit Details" modal for modifying notes, URLs, etc.
- [ ] **UI:** Add a "Delete" action to the table rows with a confirmation prompt

---

## Data Model (MVP)
The MVP utilizes a flat, single-table structure (`applications`) to minimize relational complexity during initial development.

| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | SERIAL | Primary Key, auto-incrementing |
| `company_name` | VARCHAR(255) | Required |
| `job_title` | VARCHAR(255) | Required |
| `status` | ENUM | Draft, Applied, Interviewing, Rejected, Offer |
| `job_url` | TEXT | |
| `date_applied` | DATE | |
| `notes` | TEXT | Recruiter info, prep notes, salary details |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
