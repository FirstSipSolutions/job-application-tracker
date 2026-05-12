import { fetchSiliconHarbour } from "./sources/siliconHarbour.js";
import { fetchJobicy }         from "./sources/jobicy.js";
import { passesFilter }        from "./filter.js";

// Fetches all sources in parallel. Promise.allSettled means one failing API
// never breaks the feed — you just get fewer results that session.
export async function fetchJobs() {
  const results = await Promise.allSettled([
    fetchSiliconHarbour(),
    fetchJobicy(),
  ]);

  const all = results.flatMap(r => r.status === "fulfilled" ? r.value : []);

  // Dedup by URL so the same job posted on multiple boards only shows once.
  const seen = new Set();
  const deduped = all.filter(job => {
    if (!job.url || seen.has(job.url)) return false;
    seen.add(job.url);
    return true;
  });

  return deduped.filter(passesFilter);
}
