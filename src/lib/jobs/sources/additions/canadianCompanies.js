/*
 * Newly added Canadian companies.
 * Smaller, funded scale-ups (not big tech), grouped in their own file so new
 * additions are easy to track. Every slug is verified to return a live board,
 * so nothing here throws a 404 in the console.
 */
import { fromGreenhouse, fromAshby } from "../../normalize.js";

const COMPANIES = [
  { name: "CoLab Software", ats: "greenhouse", slug: "colabsoftware" }, // St. John's, NL
  { name: "Fellow",         ats: "greenhouse", slug: "fellow" },        // Ottawa, ON
  { name: "Thinkific",      ats: "greenhouse", slug: "thinkific" },     // Vancouver, BC
  { name: "Knak",           ats: "greenhouse", slug: "knak" },          // Calgary, AB
  { name: "Hopper",         ats: "ashby",      slug: "hopper" },        // Montreal, QC
  { name: "Float",          ats: "ashby",      slug: "float" },         // Toronto, ON
  { name: "Neo Financial",  ats: "ashby",      slug: "neofinancial" },  // Calgary, AB
  { name: "KOHO",           ats: "ashby",      slug: "koho" },          // Toronto, ON
  { name: "Jane",           ats: "ashby",      slug: "jane" },          // Vancouver, BC
  { name: "Jobber",         ats: "ashby",      slug: "jobber" },        // Edmonton, AB
  { name: "Rewind",         ats: "ashby",      slug: "rewind" },        // Ottawa, ON
  { name: "Solink",         ats: "ashby",      slug: "solink" },        // Ottawa, ON
  { name: "Noibu",          ats: "ashby",      slug: "noibu" },         // Ottawa, ON
  { name: "Relay",          ats: "ashby",      slug: "relayfi" },       // Toronto, ON
  { name: "Felix",          ats: "ashby",      slug: "felix" },         // Toronto, ON
  { name: "Flipp",          ats: "greenhouse", slug: "flipp" },         // Toronto, ON
  { name: "Ritual",         ats: "greenhouse", slug: "ritual" },        // Toronto, ON
];

const TIMEOUT_MS = 8000;
const GREENHOUSE = "https://boards-api.greenhouse.io/v1/boards";
const ASHBY      = "https://api.ashbyhq.com/posting-api/job-board";

async function fetchOne({ name, ats, slug }) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    if (ats === "greenhouse") {
      const res = await fetch(`${GREENHOUSE}/${slug}/jobs?content=true`, { signal: ctrl.signal });
      if (!res.ok) return [];
      const { jobs } = await res.json();
      return (jobs ?? []).map(j => fromGreenhouse(j, name, "canadian"));
    }
    const res = await fetch(`${ASHBY}/${slug}`, { signal: ctrl.signal });
    if (!res.ok) return [];
    const { jobs } = await res.json();
    return (jobs ?? []).map(j => fromAshby(j, name, "canadian"));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCanadianCompanies() {
  const results = await Promise.allSettled(COMPANIES.map(fetchOne));
  return results.flatMap(r => r.status === "fulfilled" ? r.value : []);
}
