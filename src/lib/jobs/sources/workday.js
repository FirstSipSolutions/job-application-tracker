import { fromWorkday, toSnippet } from "../normalize.js";
import { isRemote, isTech } from "../filter.js";

// Proxied via /api/workday (CF function in prod, vite middleware in dev).
// Board names come from the public Workday URL: tenant.wdN.myworkdayjobs.com/en-US/{board}/...
// Every tenant here is verified to return 200 from the CXS API. TELUS, Bell,
// Scotiabank, RBC and Manulife were removed: their tenants reject anonymous
// CXS requests (422/404), so they only ever produced wasted requests.
const COMPANIES = [
  { name: "Verafin",  tenant: "nasdaq",  board: "Global_External_Site", wd: 1, category: "canadian" },
  { name: "Sun Life", tenant: "sunlife", board: "Experienced",          wd: 3, category: "canadian" },
  { name: "BMO",      tenant: "bmo",     board: "External",             wd: 3, category: "canadian" },
  { name: "CIBC",     tenant: "cibc",    board: "search",               wd: 3, category: "canadian" },
  { name: "TD Bank",  tenant: "td",      board: "TD_Bank_Careers",      wd: 3, category: "canadian" },
];

// Scope the search: big tenants (banks) have thousands of postings and the API
// caps at 100 - an empty search wastes the budget on non-dev roles.
const SEARCH     = "software developer";
const TIMEOUT_MS = 10000;
const BASE       = "/api/workday";

// Search results carry no description, which starves Groq of the text it needs
// for experience/Canada classification. Fetch details for the few jobs that
// can actually surface (remote + tech title) - capped to bound request count.
const DETAIL_CAP = 5;

async function enrichDescriptions(jobs, { tenant, board, wd }, signal) {
  const candidates = jobs.filter(j => j._externalPath && isRemote(j) && isTech(j)).slice(0, DETAIL_CAP);
  await Promise.allSettled(candidates.map(async j => {
    const params = new URLSearchParams({ tenant, board, wd: String(wd), path: j._externalPath });
    const res = await fetch(`${BASE}?${params}`, { signal });
    if (!res.ok) return;
    const data = await res.json();
    const html = data.jobPostingInfo?.jobDescription ?? "";
    if (html) j.descriptionSnippet = toSnippet(html);
  }));
}

async function fetchOne({ name, tenant, board, wd, category }) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const params = new URLSearchParams({ tenant, board, wd: String(wd), q: SEARCH });
    const res = await fetch(`${BASE}?${params}`, { signal: ctrl.signal });
    if (!res.ok) return [];
    const { jobPostings } = await res.json();
    const jobs = (jobPostings ?? []).map(j => fromWorkday(j, name, tenant, board, wd, category));
    await enrichDescriptions(jobs, { tenant, board, wd }, ctrl.signal);
    return jobs;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchWorkday() {
  const results = await Promise.allSettled(COMPANIES.map(fetchOne));
  return results.flatMap(r => r.status === "fulfilled" ? r.value : []);
}
