import { fromJobBank } from "../normalize.js";

// Job Bank Canada -- Government of Canada job board.
// Uses the Atom feed at /jobsearch/feed/jobSearchRSSfeed proxied through /api/jobbank.
// Two search terms fetched and deduped. XML parsed client-side via regex.
// Note: the Atom feed does not include employer name -- company field will be empty
// until Groq classifies the posting or the user clicks through.

const BASE        = "/api/jobbank";
const TIMEOUT_MS  = 10000;
const TERMS       = ["software developer", "software engineer", "web developer", "full stack", "frontend developer"];

function parseAtom(xml) {
  const entries = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = entryRe.exec(xml)) !== null) {
    const block = m[1];
    const title    = (block.match(/<title[^>]*><!\[CDATA\[(.+?)\]\]>/)                            ?? [])[1]?.trim();
    const url      = (block.match(/href="(https:\/\/www\.jobbank\.gc\.ca\/jobsearch\/jobposting\/\d+)"/) ?? [])[1];
    const postedAt = (block.match(/<updated>(.+?)<\/updated>/)                                    ?? [])[1] ?? null;
    const summary  = (block.match(/<summary[^>]*><!\[CDATA\[([\s\S]*?)\]\]>/)                    ?? [])[1] ?? "";
    const location = (summary.match(/Location:<\/strong>\s*([^<]+)/)                              ?? [])[1]?.trim() ?? "";
    const salary   = (summary.match(/Salary:<\/strong>\s*([^<]+)/)                               ?? [])[1]?.trim() ?? null;
    const company  = (summary.match(/Employer:<\/strong>\s*([^<]+)/)                             ?? [])[1]?.trim() ?? null;
    if (title && url) entries.push({ title, url, postedAt, location, salary, company });
  }
  return entries;
}

async function fetchTerm(term, signal) {
  const res = await fetch(`${BASE}?term=${encodeURIComponent(term)}`, { signal });
  if (!res.ok) return [];
  return parseAtom(await res.text());
}

export async function fetchJobBank() {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const results = await Promise.allSettled(TERMS.map(t => fetchTerm(t, ctrl.signal)));
    const seen = new Set();
    const jobs = [];
    for (const r of results) {
      if (r.status !== "fulfilled") continue;
      for (const j of r.value) {
        if (j.url && !seen.has(j.url)) {
          seen.add(j.url);
          jobs.push(fromJobBank(j));
        }
      }
    }
    return jobs;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
