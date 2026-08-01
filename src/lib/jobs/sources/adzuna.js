import { fromAdzuna } from "../normalize.js";

// Adzuna Canada aggregator, proxied through /api/adzuna so the API keys stay
// server-side. A 6-hour local cache keeps us well under Adzuna's free daily
// call cap - repeat loads and live polling reuse the cache instead of calling.
const BASE       = "/api/adzuna";
const TIMEOUT_MS = 10000;
// Remote-scoped queries on the Canada endpoint. "remote developer" is by far
// the highest-yield term (a full page of remote Canadian roles each time), so
// it leads; the rest widen coverage across stacks. Every result is Canadian and
// remote by construction, so this is the main volume source.
const TERMS      = ["remote developer", "remote software engineer", "remote full stack", "remote frontend developer", "remote backend developer"];
const PAGES      = 4;                     // 4 pages x 5 terms = 20 calls per refresh (cached 6h)
const CACHE_KEY  = "cv-adzuna-cache";
const CACHE_TTL  = 6 * 60 * 60 * 1000;    // 6 hours

function readCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null");
    if (c && Date.now() - c.at < CACHE_TTL) return c.jobs;
  } catch { /* ignore */ }
  return null;
}

function writeCache(jobs) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ jobs, at: Date.now() })); } catch { /* quota */ }
}

async function fetchPage(term, page, signal) {
  const res = await fetch(`${BASE}?what=${encodeURIComponent(term)}&page=${page}`, { signal });
  if (!res.ok) return [];
  const { results } = await res.json();
  return (results ?? []).map(fromAdzuna);
}

export async function fetchAdzuna() {
  const cached = readCache();
  if (cached) return cached;              // stay under the daily API cap

  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const tasks = [];
    for (const term of TERMS)
      for (let p = 1; p <= PAGES; p++) tasks.push(fetchPage(term, p, ctrl.signal));
    const settled = await Promise.allSettled(tasks);
    const all     = settled.flatMap(r => r.status === "fulfilled" ? r.value : []);
    const seen    = new Set();
    const jobs    = all.filter(j => j.url && !seen.has(j.url) && seen.add(j.url));
    if (jobs.length) writeCache(jobs);     // only cache real results, so errors retry next load
    return jobs;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
