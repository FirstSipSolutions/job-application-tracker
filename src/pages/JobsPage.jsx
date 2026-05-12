import { useState, useEffect, useRef, useCallback } from "react";
import AppNav from "../components/layout/AppNav.jsx";
import JobCard from "../components/jobs/JobCard.jsx";
import { fetchSiliconHarbour } from "../lib/jobs/sources/siliconHarbour.js";
import { fetchGreenhouse }     from "../lib/jobs/sources/greenhouse.js";
import { fetchAshby }          from "../lib/jobs/sources/ashby.js";
import { passesFilter }        from "../lib/jobs/filter.js";
import { useApplications }     from "../hooks/useApplications.js";
import "../styles/jobs.css";

const RECENCY = [
  { key: "all",  label: "All",         days: Infinity },
  { key: "3d",   label: "Last 3 days", days: 3 },
  { key: "week", label: "This week",   days: 7 },
];

const SOURCES   = [fetchSiliconHarbour, fetchGreenhouse, fetchAshby];
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

// Swap public/sounds/new-job.mp3 to change the notification sound.
function ping() {
  try { new Audio("/sounds/new-job.mp3").play(); } catch {}
}

export default function JobsPage() {
  const [jobs,     setJobs]     = useState([]);
  const [resolved, setResolved] = useState(0);
  const [recency,  setRecency]  = useState("all");
  const [live,     setLive]     = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [page,     setPage]     = useState(1);
  const seenUrls  = useRef(new Set());
  const pollTimer = useRef(null);
  const { addApp } = useApplications();

  const loadAll = useCallback(async (isLivePoll = false) => {
    let done = 0;
    let incoming = [];

    await Promise.allSettled(
      SOURCES.map(fn =>
        fn()
          .then(raw => {
            const fresh = raw.filter(passesFilter);
            incoming = [...incoming, ...fresh];
            done++;
            if (!isLivePoll) setResolved(done);
          })
          .catch(() => { done++; if (!isLivePoll) setResolved(done); })
      )
    );

    const all = dedup(incoming).sort(byNewest);

    if (isLivePoll) {
      const brand = all.filter(j => !seenUrls.current.has(j.url));
      if (brand.length > 0) {
        ping();
        setNewCount(n => n + brand.length);
        brand.forEach(j => seenUrls.current.add(j.url));
        setJobs(prev => dedup([...brand, ...prev]).sort(byNewest));
      }
    } else {
      all.forEach(j => seenUrls.current.add(j.url));
      setJobs(all);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial load
  useEffect(() => {
    loadAll(false);
  }, [loadAll]);

  // Live polling
  useEffect(() => {
    if (live) {
      pollTimer.current = setInterval(() => loadAll(true), POLL_MS);
    } else {
      clearInterval(pollTimer.current);
    }
    return () => clearInterval(pollTimer.current);
  }, [live, loadAll]);

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

  function toggleLive() {
    setLive(l => !l);
    setNewCount(0);
  }

  const loading  = resolved < SOURCES.length && jobs.length === 0;
  const cutoff   = RECENCY.find(r => r.key === recency)?.days ?? Infinity;
  const filtered = cutoff === Infinity
    ? jobs
    : jobs.filter(j => {
        if (!j.postedAt) return true;
        return (Date.now() - new Date(j.postedAt)) / 864e5 <= cutoff;
      });
  const visible  = filtered.slice(0, page * PAGE_SIZE);
  const hasMore  = visible.length < filtered.length;

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
                : `${visible.length} real listings - direct from company boards, no promoted`}
            </p>
          </div>

          <div className="jobs-controls">
            <div className="jobs-filter-row">
              {RECENCY.map(r => (
                <button
                  key={r.key}
                  className={`jobs-filter-btn${recency === r.key ? " active" : ""}`}
                  onClick={() => { setRecency(r.key); setPage(1); }}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button
              className={`jobs-live-btn${live ? " live-on" : ""}`}
              onClick={toggleLive}
              title="Polls all sources every 5 min and plays a sound when new jobs appear"
            >
              <span className={`live-dot${live ? " live-dot-pulse" : ""}`} />
              {live ? "Live" : "Go Live"}
              {newCount > 0 && <span className="live-badge">{newCount}</span>}
            </button>
          </div>
        </div>

        <div className="jobs-grid">
          {loading && (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="job-card job-card-skeleton" />
            ))
          )}
          {visible.map(job => (
            <JobCard key={job.id} job={job} onApply={logAndOpen} />
          ))}
          {!loading && filtered.length === 0 && (
            <p className="jobs-empty">No listings matched this filter - try "All".</p>
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
