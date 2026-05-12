import { fetchSiliconHarbour } from "./sources/siliconHarbour.js";
import { fetchGreenhouse }    from "./sources/greenhouse.js";
import { fetchAshby }         from "./sources/ashby.js";
import { fetchWorkday }       from "./sources/workday.js";
import { passesFilter }       from "./filter.js";

const CACHE_KEY = "cv-vault-jobs-v1";
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, jobs } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return jobs;
  } catch {
    return null;
  }
}

function writeCache(jobs) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), jobs }));
  } catch {}
}

// fresh=true bypasses the cache (used by a manual refresh button).
export async function fetchJobs({ fresh = false } = {}) {
  if (!fresh) {
    const cached = readCache();
    if (cached) return cached;
  }

  const results = await Promise.allSettled([
    fetchSiliconHarbour(),
    fetchGreenhouse(),
    fetchAshby(),
    fetchWorkday(),
  ]);

  const all = results.flatMap(r => r.status === "fulfilled" ? r.value : []);

  // Dedup by URL — same job can appear on multiple boards.
  const seen    = new Set();
  const deduped = all.filter(job => {
    if (!job.url || seen.has(job.url)) return false;
    seen.add(job.url);
    return true;
  });

  const filtered = deduped.filter(passesFilter);
  writeCache(filtered);
  return filtered;
}
