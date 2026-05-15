import { fromHimalayas } from "../normalize.js";

// Canadian remote jobs with country=CA baked into the query.
// Returns all job types — isTech() in passesFilter drops the non-dev ones.
// API docs: himalayas.app/api
// Requests go through /api/himalayas (Cloudflare Function in prod, Vite proxy in dev)
// to bypass the CORS restriction on himalayas.app.
const BASE       = "/api/himalayas";
const TIMEOUT_MS = 8000;

export async function fetchHimalayas() {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(BASE, { signal: ctrl.signal });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.jobs ?? [];
    return jobs.map(fromHimalayas);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
