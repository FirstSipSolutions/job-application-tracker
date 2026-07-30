/*
 * useJobFeed
 * Runs the job pipeline: fetch every source, filter to real candidates,
 * classify with the AI, and cache the result so re-visits load instantly.
 * Also drives "live" mode, which polls for new listings in the background.
 * Returns the ranked jobs plus the status the page renders.
 */


import { useState, useEffect, useRef, useCallback } from "react";
import { fetchSiliconHarbour } from "../lib/jobs/sources/siliconHarbour.js";
import { fetchDigitalNS }      from "../lib/jobs/sources/digitalNovascotia.js";
import { fetchJobBank }        from "../lib/jobs/sources/jobBank.js";
import { fetchTechNL }         from "../lib/jobs/sources/techNL.js";
import { fetchGreenhouse }     from "../lib/jobs/sources/greenhouse.js";
import { fetchAshby }          from "../lib/jobs/sources/ashby.js";
import { fetchHimalayas }      from "../lib/jobs/sources/himalayas.js";
import { fetchJobicy }         from "../lib/jobs/sources/jobicy.js";
import { fetchRemotive }       from "../lib/jobs/sources/remotive.js";
import { fetchLever }          from "../lib/jobs/sources/lever.js";
import { fetchWorkday }        from "../lib/jobs/sources/workday.js";
import { fetchSmartRecruiters } from "../lib/jobs/sources/smartrecruiters.js";
import { fetchWeWorkRemotely }  from "../lib/jobs/sources/weWorkRemotely.js";
import { fetchCanadianCompanies } from "../lib/jobs/sources/additions/canadianCompanies.js";
import { fetchAdzuna }           from "../lib/jobs/sources/adzuna.js";
import { passesFilter, passesCanadaGate, isRemote, isTech, isFresh } from "../lib/jobs/filter.js";
import { classifyJobs } from "../lib/llm/classifyJobs.js";
import { applyMemory } from "../lib/jobs/companyMemory.js";
import { byScore, byNewest } from "../lib/jobs/score.js";

// RemoteOK and Remote.co are left out: RemoteOK returns mostly non-dev listings,
// Remote.co 403-blocks automated requests.
const SOURCES = [fetchSiliconHarbour, fetchDigitalNS, fetchJobBank, fetchTechNL, fetchCanadianCompanies, fetchAdzuna, fetchGreenhouse, fetchAshby, fetchHimalayas, fetchLever, fetchWorkday, fetchSmartRecruiters, fetchWeWorkRemotely, fetchJobicy, fetchRemotive];
const POLL_MS = 5 * 60 * 1000;

// How many sources the feed pulls from - used by the page's status line.
export const JOB_SOURCE_COUNT = SOURCES.length;

function dedup(arr) {
  const seen = new Set();
  return arr.filter(j => {
    if (!j.url || seen.has(j.url)) return false;
    seen.add(j.url);
    return true;
  });
}

function ping() {
  try { new Audio("/sounds/new-job.mp3").play(); } catch { /* sound is optional */ }
}

// Persist the last job list so the page loads instantly on re-nav. Groq fields
// are baked into the cached objects so they survive without re-classifying.
const JOBS_CACHE_KEY = "cv-vault-jobs-v4";

function readJobsCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(JOBS_CACHE_KEY) ?? "null");
    if (!raw) return [];
    return (raw.jobs ?? []).filter(j => j.postedAt && (Date.now() - new Date(j.postedAt)) / 864e5 <= 7);
  } catch { return []; }
}

function writeJobsCache(jobs) {
  try {
    localStorage.setItem(JOBS_CACHE_KEY, JSON.stringify({ jobs: jobs.slice(0, 250), at: Date.now() }));
  } catch {
    try { localStorage.removeItem(JOBS_CACHE_KEY); } catch { /* quota exceeded - nothing to free */ }
  }
}

async function fetchAll() {
  const incoming = [];
  await Promise.allSettled(
    SOURCES.map(fn =>
      fn().then(raw => incoming.push(...raw.filter(passesFilter))).catch(() => {})
    )
  );
  return dedup(incoming).sort(byNewest);
}

export function useJobFeed() {
  // Cached jobs render on first paint - no blank page while sources load.
  const [jobs,        setJobs]        = useState(() => applyMemory(readJobsCache().sort(byScore())));
  const [resolved,    setResolved]    = useState(0);
  const [sourceStats, setSourceStats] = useState({});
  const [live,        setLive]        = useState(false);
  const [liveJobs,    setLiveJobs]    = useState([]);
  const [polling,     setPolling]     = useState(false);
  const [aiFiltering, setAiFiltering] = useState(false);
  const seenUrls       = useRef(new Set());
  const classifiedUrls = useRef(new Set());
  const pollTimer      = useRef(null);

  useEffect(() => {
    let active = true;
    let done   = 0;
    const collected = [];

    const cached    = readJobsCache();
    const cachedMap = new Map(cached.map(j => [j.url, j]));
    cached.forEach(j => {
      seenUrls.current.add(j.url);
      if (j.canadaOpen !== undefined || j.groqStack || j.groqExp) {
        classifiedUrls.current.add(j.url);
      }
    });

    SOURCES.forEach(fn => {
      fn()
        .then(raw => {
          if (!active) return;
          const fresh     = raw.filter(passesFilter);
          const noRemote  = raw.filter(j => !isRemote(j)).length;
          const noTech    = raw.filter(j => isRemote(j) && !isTech(j)).length;
          const noCanada  = raw.filter(j => isRemote(j) && isTech(j) && !passesCanadaGate(j)).length;
          const stale     = raw.filter(j => isRemote(j) && isTech(j) && passesCanadaGate(j) && !isFresh(j)).length;
          console.log(`[Source] ${fn.name}: ${raw.length} raw -> ${fresh.length} passed (dropped: ${noRemote} not-remote, ${noTech} not-tech, ${noCanada} not-canada, ${stale} stale)`);
          setSourceStats(prev => ({ ...prev, [fn.name]: { raw: raw.length, passed: fresh.length } }));
          fresh.forEach(j => seenUrls.current.add(j.url));
          // Restore cached Groq fields so scoring works before Groq re-runs.
          const enriched = fresh.map(j => {
            const hit = cachedMap.get(j.url);
            return hit ? { ...j, canadaOpen: j.canadaOpen ?? hit.canadaOpen, groqStack: j.groqStack ?? hit.groqStack, groqExp: j.groqExp ?? hit.groqExp } : j;
          });
          collected.push(...enriched);
          setJobs(dedup([...collected, ...cached]).sort(byScore()));
        })
        .catch(err => {
          console.error(`[Source] ${fn.name} failed:`, err);
          setSourceStats(prev => ({ ...prev, [fn.name]: { failed: true } }));
        })
        .finally(() => {
          if (!active) return;
          done++;
          setResolved(done);

          if (done === SOURCES.length) {
            const base = dedup(collected).sort(byScore());
            setJobs(base);
            writeJobsCache(base);

            // Hot jobs for the dashboard "New Today" panel.
            const hotJobs = base
              .filter(j => j.postedAt && (Date.now() - new Date(j.postedAt)) < 864e5)
              .slice(0, 12)
              .map(j => ({ title: j.title, company: j.company, url: j.url, postedAt: j.postedAt, source: j.source }));
            try { localStorage.setItem("cv-vault-hot-jobs", JSON.stringify({ jobs: hotJobs, savedAt: Date.now() })); } catch { /* best-effort */ }

            // Classify everything uncached - filters need groqExp to work.
            const toClassify = base.filter(j => !classifiedUrls.current.has(j.url));
            if (toClassify.length === 0) return;
            setAiFiltering(true);
            classifyJobs(toClassify).then(scored => {
              if (!active) return;
              scored.forEach(j => classifiedUrls.current.add(j.url));
              const m = new Map(scored.map(j => [j.url, j]));
              setJobs(prev => {
                const updated = applyMemory(prev.map(j => m.get(j.url) ?? j).sort(byScore()));
                writeJobsCache(updated);
                return updated;
              });
              setAiFiltering(false);
            });
          }
        });
    });
    return () => { active = false; };
  }, []);

  const runPoll = useCallback(async () => {
    setPolling(true);
    try {
      const all   = await fetchAll();
      const brand = all.filter(j => !seenUrls.current.has(j.url));
      if (brand.length > 0) {
        ping();
        brand.forEach(j => seenUrls.current.add(j.url));
        setLiveJobs(prev => dedup([...brand, ...prev]).sort(byNewest));
      }
    } finally {
      setPolling(false);
    }
  }, []);

  useEffect(() => {
    if (!live) { clearInterval(pollTimer.current); return; }
    pollTimer.current = setInterval(runPoll, POLL_MS);
    return () => clearInterval(pollTimer.current);
  }, [live, runPoll]);

  function startLive() {
    setLiveJobs([]);
    setLive(true);
  }

  function stopLive() {
    setLive(false);
    setPolling(false);
  }

  // Classify a batch that is about to become visible (used by "load more").
  const classifyMore = useCallback((batch) => {
    const toClassify = batch.filter(j => !classifiedUrls.current.has(j.url));
    if (toClassify.length === 0) return;
    classifyJobs(toClassify).then(scored => {
      scored.forEach(j => classifiedUrls.current.add(j.url));
      const m = new Map(scored.map(j => [j.url, j]));
      setJobs(prev => applyMemory(prev.map(j => m.get(j.url) ?? j)));
    });
  }, []);

  return { jobs, resolved, sourceStats, aiFiltering, live, liveJobs, polling, startLive, stopLive, classifyMore };
}
