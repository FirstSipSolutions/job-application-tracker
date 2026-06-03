import { fromRemotive } from "../normalize.js";

// Remotive is remote-first by design — every job on the platform is remote.
// The key advantage over Greenhouse/Ashby: the `candidate_required_location`
// field tells us *explicitly* where candidates must be located.
// "Worldwide" = definitively Canada-open. "USA" = definitively excluded.
//
// We fetch three categories in parallel to cover the full dev scope:
//   software-dev  → frontend, backend, full stack
//   devops-sysadmin → DevOps, SRE, cloud, platform
//   qa            → QA, SDET, test automation

const BASE       = "https://remotive.com/api/remote-jobs";
const TIMEOUT_MS = 8000;
const CATEGORIES = ["software-dev", "devops-sysadmin", "qa"];

async function fetchCategory(category, signal) {
  try {
    const res = await fetch(`${BASE}?category=${category}&limit=100`, { signal });
    if (!res.ok) return [];
    const { jobs } = await res.json();
    return (jobs ?? []).map(fromRemotive);
  } catch {
    return [];
  }
}

export async function fetchRemotive() {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const results = await Promise.allSettled(
      CATEGORIES.map(cat => fetchCategory(cat, ctrl.signal))
    );
    return results.flatMap(r => r.status === "fulfilled" ? r.value : []);
  } finally {
    clearTimeout(timer);
  }
}
