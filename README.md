# Job Application Tracker

## Overview
A lean, full-stack application designed to organize and track job applications and interview statuses. This project prioritizes a fast, functional Minimum Viable Product (MVP) over premature optimization, using a single-table database architecture to ship quickly.

The initial repository structure, database schema, and server boilerplate were scaffolded using AI to establish a standardized baseline and accelerate development.

## Tech Stack
* **Frontend:** React
* **Backend:** Node.js + Express
* **Database:** PostgreSQL
* **Deployment:** Render or Railway (MVP) -> AWS (Phase 2)

---

## Workflow & Task Delegation
To maintain high velocity and avoid integration bottlenecks, development is divided into **vertical feature slices**. Both developers work across the database, API, and UI for their specific features.

### Phase 0: Foundation (Completed)
* AI-assisted scaffolding of the frontend (React) and backend (Node/Express) directories.
* Generation of the `applications` PostgreSQL schema.
* Establishment of the baseline API request/response contracts.

### Developer A: The "Create & Read" Slice
*Focus: Data ingestion and primary display.*
- [ ] **DB/API:** Build `POST /api/applications` to accept new entries.
- [ ] **DB/API:** Build `GET /api/applications` to retrieve all entries.
- [ ] **UI:** Build the "Add Application" form component and wire it to the POST route.
- [ ] **UI:** Build the main Dashboard table component to fetch and map the GET data.

### Developer B: The "Update & Delete" Slice
*Focus: State mutation and data management.*
- [ ] **DB/API:** Build `PUT /api/applications/:id` to handle status changes and note updates.
- [ ] **DB/API:** Build `DELETE /api/applications/:id` to remove entries.
- [ ] **UI:** Add an inline status dropdown to the Dashboard table to trigger the PUT route.
- [ ] **UI:** Build an "Edit Details" modal for modifying notes, URLs, etc.
- [ ] **UI:** Add a "Delete" action to the table rows with a confirmation prompt.

---

## Data Model (MVP)

The MVP utilizes a flat, single-table structure (`applications`) to minimize relational complexity during initial development.

| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | SERIAL / UUID | Primary Key |
| `company_name` | VARCHAR | |
| `job_title` | VARCHAR | |
| `status` | VARCHAR | Draft, Applied, Interviewing, Rejected, Offer |
| `job_url` | TEXT | |
| `date_applied` | DATE | |
| `notes` | TEXT | Recruiter info, prep, etc. |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
