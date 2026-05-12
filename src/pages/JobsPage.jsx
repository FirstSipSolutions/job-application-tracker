import { useState, useEffect, useRef, useCallback } from "react";
import AppNav from "../components/layout/AppNav.jsx";
import JobCard from "../components/jobs/JobCard.jsx";
import { fetchSiliconHarbour } from "../lib/jobs/sources/siliconHarbour.js";
import { fetchGreenhouse }     from "../lib/jobs/sources/greenhouse.js";
import { fetchAshby }          from "../lib/jobs/sources/ashby.js";
import { fetchWorkday }        from "../lib/jobs/sources/workday.js";
import { passesFilter }        from "../lib/jobs/filter.js";
import { useApplications }     from "../hooks/useApplications.js";
import "../styles/jobs.css";

const SOURCES   = [fetchSiliconHarbour, fetchGreenhouse, fetchAshby, fetchWorkday];
const POLL_MS   = 5 * 60 * 1000;
const PAGE_SIZE = 10;

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

function jobCountry(job) {
  return job.category === "canadian" || job.currency === "CAD" ? "canadian" : "us";
}

function jobLevel(title) {
  const t = (title ?? "").toLowerCase();
  if (/\bjunior\b|\bentry\b|\bjr\b|\bnew.?grad\b|\bintern\b/.test(t)) return "junior";
  if (/\bsenior\b|\bsr\b|\blead\b|\bstaff\b|\bprincipal\b/.test(t)) return "senior";
  return "mid";
}

// Swap public/sounds/new-job.mp3 to change the notification sound.
function ping() {
  try { new Audio("/sounds/new-job.mp3").play(); } catch {}
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
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterSalary,  setFilterSalary]  = useState("all");
  const [filterExp,     setFilterExp]     = useState("all");
  const [page,      setPage]      = useState(1);
  const [live,      setLive]      = useState(false);
  const [liveJobs,  setLiveJobs]  = useState([]);
  const [polling,   setPolling]   = useState(false);
  const seenUrls  = useRef(new Set());
  const pollTimer = useRef(null);
  const { addApp } = useApplications();

  // Initial load - progressive per source
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

  // Live poll - fires every POLL_MS while live is on
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
      status:  "Applied",
      date:    new Date().toISOString().slice(0, 10),
      notes:   `Via ${job.source}`,
    });
  }

  const loading  = resolved < SOURCES.length && jobs.length === 0;
  const filtered = jobs
    .filter(j => filterCountry === "all" || jobCountry(j) === filterCountry)
    .filter(j => filterSalary  === "all" || Boolean(j.salary))
    .filter(j => filterExp     === "all" || jobLevel(j.title) === filterExp);
  const visible  = filtered.slice(0, page * PAGE_SIZE);
  const hasMore  = visible.length < filtered.length;

  // Live view
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

  // Browse view
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
                : `${filtered.length} remote listings, sourced directly from company boards`}
            </p>
          </div>

          <div className="jobs-controls">
            <div className="jobs-filter-row">
              <select
                className="jobs-filter-select"
                value={filterCountry}
                onChange={e => { setFilterCountry(e.target.value); setPage(1); }}
              >
                <option value="all">All countries</option>
                <option value="canadian">Canadian</option>
                <option value="us">US</option>
              </select>
              <select
                className="jobs-filter-select"
                value={filterSalary}
                onChange={e => { setFilterSalary(e.target.value); setPage(1); }}
              >
                <option value="all">Any salary</option>
                <option value="listed">Salary listed</option>
              </select>
              <select
                className="jobs-filter-select"
                value={filterExp}
                onChange={e => { setFilterExp(e.target.value); setPage(1); }}
              >
                <option value="all">All levels</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
              </select>
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
            <p className="jobs-empty">No listings matched these filters.</p>
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
