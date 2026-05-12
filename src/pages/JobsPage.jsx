import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import AppNav from "../components/layout/AppNav.jsx";
import JobCard from "../components/jobs/JobCard.jsx";
import { fetchSiliconHarbour } from "../lib/jobs/sources/siliconHarbour.js";
import { fetchGreenhouse }     from "../lib/jobs/sources/greenhouse.js";
import { fetchAshby }          from "../lib/jobs/sources/ashby.js";
import { passesFilter, isCanadaJob, isCanadaEligible, getCountry, getDaysOld, getTechStack, getSeniority, TECH_OPTIONS, SENIORITY_OPTIONS } from "../lib/jobs/filter.js";
import { useApplications }     from "../hooks/useApplications.js";
import "../styles/jobs.css";

const SOURCES   = [fetchSiliconHarbour, fetchGreenhouse, fetchAshby];
const POLL_MS   = 5 * 60 * 1000;
const PAGE_SIZE = 10;

const POSTED_BANDS = [
  { value: 1,  label: "Today" },
  { value: 3,  label: "Last 3 days" },
  { value: 7,  label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
];

function matchesRegion(job, region) {
  if (region === "ca-elig-any") return isCanadaEligible(job);
  if (region === "ca-elig-us")  return isCanadaEligible(job) && getCountry(job) === "US";
  if (region === "ca-elig-eu")  return isCanadaEligible(job) && getCountry(job) === "EU";
  if (region === "ca-elig-uk")  return isCanadaEligible(job) && getCountry(job) === "UK";
  if (region === "canada")      return isCanadaJob(job);
  if (region === "all-us")      return getCountry(job) === "US";
  if (region === "all-eu")      return getCountry(job) === "EU";
  if (region === "all-uk")      return getCountry(job) === "UK";
  if (region === "global")      return getCountry(job) === "Global";
  return true;
}

function dedup(arr) {
  const seen = new Set();
  return arr.filter(j => {
    if (!j.url || seen.has(j.url)) return false;
    seen.add(j.url);
    return true;
  });
}

function byNewest(a, b) {
  return new Date(b.postedAt ?? 0) - new Date(a.postedAt ?? 0);
}

function ping() {
  try { new Audio("/sounds/new-job.mp3").play(); } catch { /* sound is optional */ }
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

export default function JobsPage() {
  const [jobs,      setJobs]      = useState([]);
  const [resolved,  setResolved]  = useState(0);
  const [region,    setRegion]    = useState("ca-elig-any");
  const [posted,    setPosted]    = useState(0);
  const [tech,      setTech]      = useState("");
  const [seniority, setSeniority] = useState("");
  const [page,      setPage]      = useState(1);
  const [live,      setLive]      = useState(false);
  const [liveJobs,  setLiveJobs]  = useState([]);
  const [polling,   setPolling]   = useState(false);
  const seenUrls  = useRef(new Set());
  const pollTimer = useRef(null);
  const { addApp } = useApplications();

  // Initial load, progressive per source so the page fills as fetches finish.
  useEffect(() => {
    let active = true;
    let done   = 0;
    SOURCES.forEach(fn => {
      fn()
        .then(raw => {
          if (!active) return;
          const fresh = raw.filter(passesFilter);
          fresh.forEach(j => seenUrls.current.add(j.url));
          setJobs(prev => dedup([...prev, ...fresh]).sort(byNewest));
        })
        .catch(() => {})
        .finally(() => {
          if (!active) return;
          done++;
          setResolved(done);
        });
    });
    return () => { active = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  function logAndOpen(job) {
    window.open(job.url, "_blank", "noopener,noreferrer");
    addApp({
      url:     job.url,
      company: job.company,
      role:    job.title,
      status:  "Viewed",
      date:    new Date().toISOString().slice(0, 10),
      notes:   `Via ${job.source}`,
    });
  }

  const filtered = useMemo(() => {
    return jobs.filter(j => {
      if (!matchesRegion(j, region)) return false;
      if (posted > 0 && getDaysOld(j) > posted) return false;
      if (tech && getTechStack(j) !== tech) return false;
      if (seniority && getSeniority(j) !== seniority) return false;
      return true;
    });
  }, [jobs, region, posted, tech, seniority]);

  function resetFilters() {
    setRegion("ca-elig-any");
    setPosted(0);
    setTech("");
    setSeniority("");
    setPage(1);
  }

  const filtersActive = region !== "ca-elig-any" || posted > 0 || tech !== "" || seniority !== "";

  const loading = resolved < SOURCES.length && jobs.length === 0;
  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  if (live) {
    return (
      <div className="db-root">
        <AppNav />
        <main className="db-main">
          <div className="live-screen">
            <div className="live-screen-header">
              <span className="live-dot live-dot-pulse" />
              <span className="live-screen-title">Watching for new listings</span>
              {polling && <span className="live-scanning">scanning...</span>}
            </div>
            <p className="live-screen-sub">
              Polls {SOURCES.length} sources every 5 minutes. You will hear a sound when a new job appears.
            </p>
            <button className="live-stop-btn" onClick={stopLive}>Stop Watching</button>

            {liveJobs.length === 0 ? (
              <div className="live-waiting">
                <div className="live-waiting-ring" />
                <p>Waiting for new jobs...</p>
              </div>
            ) : (
              <div className="live-found">
                <p className="live-found-label">{liveJobs.length} new {liveJobs.length === 1 ? "listing" : "listings"} found</p>
                <div className="jobs-grid">
                  {liveJobs.map(job => (
                    <JobCard key={job.id} job={job} onApply={logAndOpen} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="db-root">
      <AppNav />
      <main className="db-main">

        <div className="jobs-header">
          <div>
            <h1 className="db-greeting-h1">Remote Jobs</h1>
            <p className="jobs-sub">
              {loading
                ? `Scanning sources... ${resolved}/${SOURCES.length} done`
                : filtersActive
                  ? `${filtered.length} of ${jobs.length} listings match`
                  : `${jobs.length} listings`}
            </p>
          </div>

          <div className="jobs-controls">
            <div className="jobs-filter-row">
              <select
                className="jobs-filter-select"
                value={region}
                onChange={(e) => { setRegion(e.target.value); setPage(1); }}
                aria-label="Country"
              >
                <optgroup label="Hiring Canadians">
                  <option value="ca-elig-any">Any country</option>
                  <option value="ca-elig-us">US (hires Canadians)</option>
                  <option value="ca-elig-eu">EU (hires Canadians)</option>
                  <option value="ca-elig-uk">UK (hires Canadians)</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="canada">Canada only</option>
                  <option value="all-us">All US</option>
                  <option value="all-eu">All EU</option>
                  <option value="all-uk">All UK</option>
                  <option value="global">Global only</option>
                </optgroup>
              </select>

              <select
                className="jobs-filter-select"
                value={posted}
                onChange={(e) => { setPosted(Number(e.target.value)); setPage(1); }}
                aria-label="Date posted"
              >
                <option value="0">Posted any time</option>
                {POSTED_BANDS.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>

              <select
                className="jobs-filter-select"
                value={tech}
                onChange={(e) => { setTech(e.target.value); setPage(1); }}
                aria-label="Tech stack"
              >
                <option value="">Any stack</option>
                {TECH_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <select
                className="jobs-filter-select"
                value={seniority}
                onChange={(e) => { setSeniority(e.target.value); setPage(1); }}
                aria-label="Seniority"
              >
                <option value="">Any level</option>
                {SENIORITY_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {filtersActive && (
                <button className="jobs-filter-reset" onClick={resetFilters}>
                  Reset
                </button>
              )}
            </div>
            <button className="jobs-live-btn" onClick={startLive}>
              <span className="live-dot" />
              Go Live
            </button>
          </div>
        </div>

        <div className="jobs-grid">
          {loading && Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="job-card job-card-skeleton" />
          ))}
          {visible.map(job => (
            <JobCard key={job.id} job={job} onApply={logAndOpen} />
          ))}
          {!loading && filtered.length === 0 && (
            <p className="jobs-empty">No listings match. Try widening the filters or hit Reset.</p>
          )}
        </div>

        {hasMore && (
          <div className="jobs-load-more">
            <button className="jobs-load-more-btn" onClick={() => setPage(p => p + 1)}>
              Load more ({filtered.length - visible.length} remaining)
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
