# Job Application Tracker

## Overview
A lean, full-stack application designed to organize and track job applications and interview statuses. This project prioritizes a fast, functional Minimum Viable Product (MVP) over premature optimization, using a single-table database architecture to ship quickly.

## Tech Stack
* **Frontend:** React
* **Backend:** Node.js + Express
* **Database:** PostgreSQL
* **Deployment:** Render or Railway (MVP) → AWS (Phase 2)

---

## Workflow & Task Delegation
Because we are both working full-stack, we are dividing the work via **vertical feature slices**. This ensures we both touch the database, API, and UI without stepping on each other's toes or causing merge conflicts.

### Phase 0: Project Kickoff (Pair Programming)
*To be completed together before branching off:*
- [ ] Initialize GitHub repository and establish main/dev branching strategy.
- [ ] Set up the React frontend boilerplate (e.g., using Vite).
- [ ] Set up the Node.js/Express backend boilerplate.
- [ ] Provision the PostgreSQL database and establish the connection.
- [ ] Finalize the database schema and write the initial migration/setup script.
- [ ] Define the JSON request/response contract for the API.

### Developer A: The "Create & Read" Slice
*Focus: Getting data into the database and rendering it on the screen.*
- [ ] **API:** Build `POST /api/applications` to accept new entries.
- [ ] **API:** Build `GET /api/applications` to retrieve all entries.
- [ ] **UI:** Build the "Add Application" form component and wire it to the POST route.
- [ ] **UI:** Build the main Dashboard table component to fetch and map the GET data.

### Developer B: The "Update & Delete" Slice
*Focus: Modifying existing data and handling state changes.*
- [ ] **API:** Build `PUT /api/applications/:id` to handle status changes and note updates.
- [ ] **API:** Build `DELETE /api/applications/:id` to remove entries.
- [ ] **UI:** Add an inline status dropdown to the Dashboard table to trigger the PUT route.
- [ ] **UI:** Build an "Edit Details" modal for modifying notes, URLs, etc.
- [ ] **UI:** Add a "Delete" action to the table rows with a confirmation prompt.

---

## Data Model (MVP)



The MVP utilizes a flat, single-table structure (`applications`).

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
