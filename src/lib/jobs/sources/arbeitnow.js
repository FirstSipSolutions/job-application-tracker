import { fromArbeitnow } from "../normalize.js";

// Arbeitnow -- free public API with CORS, no key required.
// Returns all job types globally; remote=true filter applied here.
// isTech() in passesFilter drops non-dev roles.

const URL     = "https://arbeitnow.com/api/job-board-api";
const TIMEOUT_MS = 10000;

export async function fetchArbeitnow() {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(URL, { signal: ctrl.signal });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data ?? [])
      .filter(j => j.remote === true)
      .map(fromArbeitnow);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
