import { fromLever } from "../normalize.js";

// Lever is the third most-used ATS in tech. Unlike Greenhouse/Ashby which skew
// toward large US companies, Lever is popular with mid-size teams — which is
// exactly the range most likely to hire a Canadian developer at a fair rate.
//
// The API returns full job descriptions, so Canada detection from text is real.
// API: https://api.lever.co/v0/postings/{slug}?mode=json

const COMPANIES = [
  // ── Canadian companies ────────────────────────────────────────────────────
  { name: "Wealthsimple",   slug: "wealthsimple",   category: "canadian" }, // fintech, Toronto
  { name: "PointClickCare", slug: "pointclickcare", category: "canadian" }, // healthcare SaaS, Mississauga
  { name: "Clio",           slug: "clio",           category: "canadian" }, // legal SaaS, Vancouver
  { name: "Jobber",         slug: "jobber",         category: "canadian" }, // field service mgmt, Edmonton
  { name: "Vendasta",       slug: "vendasta",       category: "canadian" }, // digital agency platform, Saskatoon
  { name: "Thinkific",      slug: "thinkific",      category: "canadian" }, // online course platform, Vancouver
  // ── Global-remote ─────────────────────────────────────────────────────────
  { name: "Toptal",         slug: "toptal",         category: "global-remote" }, // fully remote, worldwide
  { name: "Buffer",         slug: "buffer",         category: "global-remote" }, // social media tools, fully remote
  { name: "Doist",          slug: "doist",          category: "global-remote" }, // Todoist/Twist, fully remote
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
