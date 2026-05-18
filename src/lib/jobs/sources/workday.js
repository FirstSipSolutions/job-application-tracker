import { fromWorkday } from "../normalize.js";

// Proxied via /api/workday (CF function in prod, vite middleware in dev).
// board names are taken from the public Workday URL: tenant.wdN.myworkdayjobs.com/en-US/{board}/...
const COMPANIES = [
  // ── Canadian ──────────────────────────────────────────────────────────────────
  { name: "Verafin",    tenant: "nasdaq",     board: "Global_External_Site", wd: 1, category: "canadian" },
  { name: "TELUS",      tenant: "telus",      board: "TELUS_External",       wd: 3, category: "canadian" },
  { name: "Bell",       tenant: "bell",       board: "Bell_External",        wd: 3, category: "canadian" },
  { name: "RBC",        tenant: "rbc",        board: "RBC_Jobs",             wd: 3, category: "canadian" },
  { name: "Scotiabank", tenant: "scotiabank", board: "Global_External",      wd: 3, category: "canadian" },
  { name: "Manulife",   tenant: "manulife",   board: "MFCJOBS",              wd: 3, category: "canadian" },
  { name: "Sun Life",   tenant: "sunlife",    board: "Experienced",          wd: 3, category: "canadian" },
];

const SEARCH     = "software developer";
const TIMEOUT_MS = 10000;
const BASE       = "/api/workday";

async function fetchOne({ name, tenant, board, wd, category }) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const params = new URLSearchParams({ tenant, board, wd: String(wd), q: SEARCH });
    const res = await fetch(`${BASE}?${params}`, { signal: ctrl.signal });
    if (!res.ok) return [];
    const { jobPostings } = await res.json();
    return (jobPostings ?? []).map(j => fromWorkday(j, name, tenant, board, wd, category));
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
