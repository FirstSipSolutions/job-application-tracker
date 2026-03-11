// api/applications.js
// This file is the only place in the frontend that talks to the backend.
// All fetch calls live here — components never call fetch directly.

// Calls GET /api/applications
// Returns all saved applications as an array, newest first
export async function getApplications() {
  const res = await fetch("/api/applications");
  return res.json();
}

// Calls POST /api/applications
// Sends a new application object to the backend and returns the created row
export async function createApplication(data) {
  const res = await fetch("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), // converts JS object to JSON string for the request
  });
  return res.json();
}
