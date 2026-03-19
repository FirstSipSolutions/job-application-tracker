// api/applications.js
// This file is the only place in the frontend that talks to the backend.
// All fetch calls live here — components never call fetch directly.

// Calls GET /api/applications
// Returns all saved applications as an array, newest first

// api/applications.js
// All fetch calls live here — components never call fetch directly.

const BASE = import.meta.env.VITE_API_URL || "";

export async function getApplications() {
  const res = await fetch(`${BASE}/api/applications`);
  return res.json();
}

export async function createApplication(data) {
  const res = await fetch(`${BASE}/api/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteApplication(id) {
  await fetch(`${BASE}/api/applications/${id}`, { method: "DELETE" });
}
