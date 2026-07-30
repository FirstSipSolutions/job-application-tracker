import { fromAdzuna } from "../normalize.js";

// Adzuna Canada aggregator, proxied through /api/adzuna so the API keys stay
// server-side. Returns [] when no key is configured, so nothing errors.
const BASE       = "/api/adzuna";
const TIMEOUT_MS = 10000;
const TERMS      = ["software developer", "software engineer", "web developer"];

async function fetchTerm(term, signal) {
  const res = await fetch(`${BASE}?what=${encodeURIComponent(term)}`, { signal });
  if (!res.ok) return [];
  const { results } = await res.json();
  return (results ?? []).map(fromAdzuna);
}

export async function fetchAdzuna() {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const settled = await Promise.allSettled(TERMS.map(t => fetchTerm(t, ctrl.signal)));
    const jobs    = settled.flatMap(r => r.status === "fulfilled" ? r.value : []);
    const seen    = new Set();
    return jobs.filter(j => j.url && !seen.has(j.url) && seen.add(j.url));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
