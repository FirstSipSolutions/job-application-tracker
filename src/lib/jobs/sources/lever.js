import { fromLever } from "../normalize.js";

// Lever is the third most-used ATS in tech. Unlike Greenhouse/Ashby which skew
// toward large US companies, Lever is popular with mid-size teams — which is
// exactly the range most likely to hire a Canadian developer at a fair rate.
//
// The API returns full job descriptions, so Canada detection from text is real.
// API: https://api.lever.co/v0/postings/{slug}?mode=json

const COMPANIES = [
  // ── Canadian companies ────────────────────────────────────────────────────
  { name: "Wealthsimple",   slug: "wealthsimple",   category: "canadian" },
  { name: "PointClickCare", slug: "pointclickcare", category: "canadian" },
  { name: "Clio",           slug: "clio",           category: "canadian" },
  { name: "Jobber",         slug: "jobber",         category: "canadian" },
  { name: "Vendasta",       slug: "vendasta",       category: "canadian" },
  { name: "Thinkific",      slug: "thinkific",      category: "canadian" },
  { name: "Ada",            slug: "ada",            category: "canadian" }, // AI chatbot, Toronto
  { name: "Auvik",          slug: "auvik",          category: "canadian" }, // network mgmt, Waterloo
  { name: "PolicyMe",       slug: "policyme",       category: "canadian" }, // insurtech, Toronto
  { name: "Certn",          slug: "certn",          category: "canadian" }, // background checks, Victoria BC
  { name: "Introhive",      slug: "introhive",      category: "canadian" }, // revenue intelligence, Fredericton
  { name: "Snapcommerce",   slug: "snapcommerce",   category: "canadian" }, // commerce AI, Toronto
  { name: "Borrowell",      slug: "borrowell",      category: "canadian" }, // fintech, Toronto
  { name: "Koho",           slug: "koho",           category: "canadian" }, // fintech, Vancouver
  { name: "Float",          slug: "floatcard",      category: "canadian" }, // spend management, Toronto
  { name: "Bench",          slug: "benchaccounting",category: "canadian" }, // bookkeeping, Vancouver
  { name: "Ritual",         slug: "ritual",         category: "canadian" }, // food ordering, Toronto
  // ── Global-remote ─────────────────────────────────────────────────────────
  { name: "Toptal",         slug: "toptal",         category: "global-remote" },
  { name: "Buffer",         slug: "buffer",         category: "global-remote" },
  { name: "Doist",          slug: "doist",          category: "global-remote" },
  { name: "Automattic",     slug: "automattic",     category: "global-remote" }, // WordPress, fully distributed
  { name: "Mozilla",        slug: "mozilla",        category: "global-remote" }, // Firefox, global remote
  { name: "Wikimedia",      slug: "wikimedia",      category: "global-remote" }, // fully remote, worldwide
  { name: "Springboard",    slug: "springboard",    category: "global-remote" }, // edtech, global remote
  { name: "Hotjar",         slug: "hotjar",         category: "global-remote" }, // product analytics, global remote
  { name: "Whereby",        slug: "whereby",        category: "global-remote" }, // video meetings, Norway
  { name: "Storyblok",      slug: "storyblok",      category: "global-remote" }, // headless CMS, EU/global
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
