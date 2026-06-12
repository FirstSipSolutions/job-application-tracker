import { fromWeWorkRemotely } from "../normalize.js";

// Proxied via /api/weworkremotely (CF function in prod, vite proxy in dev).
// Programming/dev category only - avoids design, support, and sales roles.
const BASE       = "/api/weworkremotely";
const TIMEOUT_MS = 8000;

export async function fetchWeWorkRemotely() {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res  = await fetch(BASE, { signal: ctrl.signal });
    if (!res.ok) return [];
    const text = await res.text();
    const doc  = new DOMParser().parseFromString(text, "text/xml");
    return [...doc.querySelectorAll("item")].map(fromWeWorkRemotely);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
