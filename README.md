# Job Application Tracker

## Overview
A lean, full-stack application designed to organize and track job applications and interview statuses. This project prioritizes a fast, functional Minimum Viable Product (MVP) over premature optimization, using a single-table architecture to get off the ground quickly. 

## Team Breakdown (Vertical Slices)
To allow both developers to work across the entire stack and avoid integration bottlenecks, responsibilities are divided by feature slices rather than frontend/backend layers.

* **Phase 0 (Pair Programming):** Agree on the database schema, initialize the repository, and set up the boilerplate React and backend frameworks. 
* **Developer 1 (The "Create & View" Slice):** Owns the `POST` and `GET` API routes, database insert/query logic, the React submission form, and rendering the core data table component.
* **Developer 2 (The "Update & Delete" Slice):** Owns the `PUT` and `DELETE` API routes, database update logic, and the React UI for editing rows (e.g., status dropdowns) and deleting applications.

## Tech Stack
* **Frontend:** React
* **Backend:** Node.js + Express OR Java + Spring Boot
* **Database:** PostgreSQL or MySQL 
* **Deployment:** Render or Railway (MVP) -> AWS (Phase 2)
