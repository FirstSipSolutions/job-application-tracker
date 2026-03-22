const BASE = import.meta.env.VITE_API_URL || "";

// getDeviceId checks localStorage for an existing device ID.
// If none exists, it generates a new UUID using the built-in browser crypto API
// and saves it so the same ID is returned on every future visit.
// This is what makes each user's data private — their ID never changes
// unless they clear their browser storage.
function getDeviceId() {
  let id = localStorage.getItem("pipeline_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("pipeline_device_id", id);
  }
  return id;
}

// x-device-id is a custom HTTP header sent with every request.
// The backend reads this header and filters all DB queries by it
// so each device only ever sees its own rows.

export async function getApplications() {
  const res = await fetch(`${BASE}/api/applications`, {
    headers: { "x-device-id": getDeviceId() },
  });
  return res.json();
}

export async function createApplication(data) {
  const res = await fetch(`${BASE}/api/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-device-id": getDeviceId(),
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteApplication(id) {
  await fetch(`${BASE}/api/applications/${id}`, {
    method: "DELETE",
    headers: { "x-device-id": getDeviceId() },
  });
}
