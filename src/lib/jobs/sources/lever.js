import { fromLever } from "../normalize.js";

// All slugs verified 200 — dead slugs removed to avoid wasted requests.
const COMPANIES = [
  // ── Canadian ──────────────────────────────────────────────────────────────
  { name: "Shopify",        slug: "shopify",        category: "canadian" },
  { name: "Jobber",         slug: "jobber",         category: "canadian" },
  { name: "Wealthsimple",   slug: "wealthsimple",   category: "canadian" },
  { name: "PointClickCare", slug: "pointclickcare", category: "canadian" },
  { name: "PolicyMe",       slug: "policyme",       category: "canadian" },
  // ── Global-remote ─────────────────────────────────────────────────────────
  { name: "Toptal",         slug: "toptal",         category: "global-remote" },
  { name: "Whereby",        slug: "whereby",        category: "global-remote" },
];

const BASE       = "https://api.lever.co/v0/postings";
const TIMEOUT_MS = 8000;

async function fetchOne({ name, slug, category }) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/${slug}?mode=json`, { signal: ctrl.signal });
    if (!res.ok) return [];
    const jobs = await res.json();
    return (jobs ?? []).map(j => fromLever(j, name, category));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchLever() {
  const results = await Promise.allSettled(COMPANIES.map(fetchOne));
  return results.flatMap(r => r.status === "fulfilled" ? r.value : []);
}
