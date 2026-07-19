import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import AppNav from "../components/layout/AppNav.jsx";
import JobCard from "../components/jobs/JobCard.jsx";
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
import { fetchSmartRecruiters }  from "../lib/jobs/sources/smartrecruiters.js";
import { fetchWeWorkRemotely }   from "../lib/jobs/sources/weWorkRemotely.js";
import { passesFilter, passesCanadaGate, isRemote, isTech, isFresh, isCanadaEligible, getCountry, getDaysOld, getTechStack, getTechTags, getExperienceLevel, TECH_OPTIONS, EXPERIENCE_OPTIONS } from "../lib/jobs/filter.js";
import { useApplications }           from "../hooks/useApplications.js";
import { classifyJobs }              from "../lib/llm/classifyJobs.js";
import { applyMemory, markApplied }  from "../lib/jobs/companyMemory.js";
import { byScore, byNewest, jobSeed } from "../lib/jobs/score.js";
import { Shuffle } from "lucide-react";
import "../styles/jobs.css";

// RemoteOK and Remote.co removed: RemoteOK returns mostly non-dev listings,
// Remote.co 403-blocks all automated requests.
const SOURCES   = [fetchSiliconHarbour, fetchDigitalNS, fetchJobBank, fetchTechNL, fetchGreenhouse, fetchAshby, fetchHimalayas, fetchLever, fetchWorkday, fetchSmartRecruiters, fetchWeWorkRemotely, fetchJobicy, fetchRemotive];
const POLL_MS   = 5 * 60 * 1000;
const PAGE_SIZE = 10;

const POSTED_BANDS = [
  { value: 1,  label: "Today" },
  { value: 3,  label: "Last 3 days" },
  { value: 7,  label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
];

const PROVINCES = [
  { value: "ON", label: "Ontario" },
  { value: "BC", label: "British Columbia" },
  { value: "AB", label: "Alberta" },
  { value: "QC", label: "Quebec" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NB", label: "New Brunswick" },
  { value: "MB", label: "Manitoba" },
  { value: "SK", label: "Saskatchewan" },
  { value: "NL", label: "Newfoundland" },
  { value: "PE", label: "PEI" },
];

const PROVINCE_PATTERNS = {
  ON: /\bontario\b|\btoronto\b|\bottawa\b|\bmississauga\b|\bwaterloo\b|\bhamilton\b/i,
  BC: /\bbritish columbia\b|\bvancouver\b|\bvictoria\b|\bkelowna\b|\bsurrey\b/i,
  AB: /\balberta\b|\bcalgary\b|\bedmonton\b/i,
  QC: /\bquebec\b|\bmontreal\b|\bgatineau\b/i,
  NS: /\bnova\s+scotia\b|\bhalifax\b/i,
  NB: /\bnew\s+brunswick\b|\bmoncton\b|\bfredericton\b/i,
  MB: /\bmanitoba\b|\bwinnipeg\b/i,
  SK: /\bsaskatchewan\b|\bregina\b|\bsaskatoon\b/i,
  NL: /\bnewfoundland\b|\bst\.?\s*john.s\b/i,
  PE: /\bprince\s+edward\s+island\b|\bpei\b|\bcharlottetown\b/i,
};

// canadaOpen field is set by Groq (classifyJobs.js).
// Falls back to the regex-based isCanadaEligible when Groq hasn't run yet.
function canadaOK(job) {
  if (job.canadaOpen !== undefined) return job.canadaOpen;
  return isCanadaEligible(job); // pre-Groq fallback
}

function matchesRegion(job, region) {
  // "canada" and "province": ingest gate already ensures everything in state is Canada-eligible.
  if (region === "canada" || region === "province") return true;
  if (region === "ca-us")     return canadaOK(job) && getCountry(job) === "US";
  if (region === "ca-global") return canadaOK(job) && (getCountry(job) === "Global" || getCountry(job) === null);
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

function ping() {
  try { new Audio("/sounds/new-job.mp3").play(); } catch { /* sound is optional */ }
}

// ── Jobs cache ────────────────────────────────────────────────────────────────
// Persists the last known job list so the page loads instantly on re-nav.
// Groq data (canadaOpen, groqStack, groqExp) is baked into the cached objects
// so it survives across visits without re-classifying.
const JOBS_CACHE_KEY = "cv-vault-jobs-v4"; // bumped - seniority gates before Canada

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

export default function JobsPage() {
  // Cached jobs render on first paint - no blank page while sources load.
  const [jobs,       setJobs]      = useState(() => applyMemory(readJobsCache().sort(byScore())));
  const [resolved,   setResolved]  = useState(0);
  const [sourceStats, setSourceStats] = useState({});
  const [region,     setRegion]    = useState("canada");
  const [province,   setProvince]  = useState("");
  const [provider,   setProvider]  = useState("");
  const [posted,     setPosted]    = useState(0);
  const [tech,       setTech]      = useState("");
  const [expLevel,   setExpLevel]  = useState("jr-mid");
  const [shuffleKey, setShuffleKey] = useState(0);
  const [page,       setPage]      = useState(1);
  const [live,        setLive]        = useState(false);
  const [liveJobs,    setLiveJobs]    = useState([]);
  const [polling,     setPolling]     = useState(false);
  const [aiFiltering, setAiFiltering] = useState(false);
  const [justViewed,  setJustViewed]  = useState(() => new Set());
  const seenUrls       = useRef(new Set());
  const classifiedUrls = useRef(new Set());
  const pollTimer      = useRef(null);
  const { apps, addApp } = useApplications();

  useEffect(() => {
    let active = true;
    let done   = 0;
    const collected = [];

    // Groq fields (canadaOpen, groqStack, groqExp) are baked into cached objects
    // so filters work immediately without re-classifying.
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
          // Restore cached Groq fields so scoring works before Groq re-runs
          const enriched = fresh.map(j => {
            const hit = cachedMap.get(j.url);
            return hit ? { ...j, canadaOpen: j.canadaOpen ?? hit.canadaOpen, groqStack: j.groqStack ?? hit.groqStack, groqExp: j.groqExp ?? hit.groqExp } : j;
          });
          collected.push(...enriched);
          // Merge with remaining cached jobs not yet replaced by fresh source data
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
            writeJobsCache(base); // persist for next visit

            // Hot jobs for Dashboard "New Today" panel
            const hotJobs = base
              .filter(j => j.postedAt && (Date.now() - new Date(j.postedAt)) < 864e5)
              .slice(0, 12)
              .map(j => ({ title: j.title, company: j.company, url: j.url, postedAt: j.postedAt, source: j.source }));
            try { localStorage.setItem("cv-vault-hot-jobs", JSON.stringify({ jobs: hotJobs, savedAt: Date.now() })); } catch { /* hot-jobs panel is best-effort */ }

            // Classify ALL uncached jobs - filters need groqExp to work correctly
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

  // Opens the posting and logs it as Viewed. Marking justViewed gives the card
  // an instant yellow tint before the addApp DB roundtrip lands in `apps`.
  function handleApply(job) {
    window.open(job.url, "_blank", "noopener,noreferrer");
    markApplied(job.company); // strongest Canada signal: you clicked Apply
    if (job.url) setJustViewed(prev => new Set(prev).add(job.url));
    addApp({
      url:     job.url,
      company: job.company,
      role:    job.title,
      status:  "Viewed",
      date:    new Date().toISOString().slice(0, 10),
      notes:   [
        `Via ${job.source}`,
        job.postedAt                 ? `Posted: ${job.postedAt.slice(0, 10)}` : null,
        job.groqStack                ? `Stack: ${job.groqStack}`       : null,
        job.groqExp                  ? `Exp: ${job.groqExp} yrs`       : null,
        job.salary                   ? `Salary: ${job.salary}`         : null,
        job.groqSal && !job.salary   ? `Salary mentioned in posting`   : null,
        job.descriptionSnippet       ? job.descriptionSnippet.slice(0, 300) : null,
      ].filter(Boolean).join(" | "),
    });
  }

  const providers = useMemo(() => {
    const set = new Set(jobs.map(j => j.source).filter(Boolean));
    return [...set].sort();
  }, [jobs]);

  // URLs the user has already opened/logged - used to tint those cards yellow.
  // Seeded from logged applications (persists across reloads) plus this session's
  // clicks for instant feedback before the DB write returns.
  const viewedUrls = useMemo(() => {
    const s = new Set(justViewed);
    apps.forEach(a => { if (a.url) s.add(a.url); });
    return s;
  }, [apps, justViewed]);

  const filtered = useMemo(() => {
    const sortFn = shuffleKey > 0
      ? (a, b) => jobSeed(shuffleKey, a.url ?? a.id) - jobSeed(shuffleKey, b.url ?? b.id)
      : byScore();
    return jobs
      .filter(j => {
        if (j.canadaOpen === false) return false;
        if (!matchesRegion(j, region)) return false;
        if (region === "province" && province) {
          const locStr = `${j.location ?? ""} ${j.workplaceType ?? ""}`;
          // Exclude only if a different province is explicitly named; otherwise include
          // Canada-wide remote jobs that don't specify any province.
          const namesDifferentProv = Object.entries(PROVINCE_PATTERNS)
            .some(([code, p]) => code !== province && p.test(locStr));
          if (namesDifferentProv) return false;
        }
        if (provider && j.source !== provider) return false;
        if (posted > 0 && getDaysOld(j) > posted) return false;
        if (tech) {
          const s = getTechStack(j);
          const tags = getTechTags(j);
          if (s !== tech && !tags.includes(tech)) return false;
        }
        if (expLevel) {
          const e          = getExperienceLevel(j);
          const title      = j.title ?? "";
          const isSenior   = /\b(senior|sr\.?|lead|staff|principal|head\s+of|vp|architect|director|manager)\b/i.test(title);
          const isJunior   = /\bjunior\b|\bjr\.?\b|\bentry[- ]?level\b|\bnew\s*grad\b/i.test(title);
          if (expLevel === "jr-mid") {
            if (e === "5+") return false;
            if (e === null && isSenior) return false;
          } else {
            if (e === expLevel) return true;   // Groq confirmed match - short-circuit
            if (e !== null)     return false;  // Groq says different tier
            // No Groq data yet - fall back to title keywords
            if (expLevel === "0-2") return isJunior;
            if (expLevel === "5+")  return isSenior;
            return !isSenior && !isJunior;     // mid: include anything with no strong signal
          }
        }
        return true;
      })
      .sort(sortFn);
  }, [jobs, region, province, provider, posted, tech, expLevel, shuffleKey]);

  function resetFilters() {
    setRegion("canada");
    setProvince("");
    setProvider("");
    setPosted(0);
    setTech("");
    setExpLevel("jr-mid");
    setShuffleKey(0);
    setPage(1);
  }

  const filtersActive = region !== "canada" || province !== "" || provider !== "" || posted > 0 || tech !== "" || expLevel !== "jr-mid" || shuffleKey > 0;

  function handleLoadMore() {
    const nextPage  = page + 1;
    setPage(nextPage);
    // Classify whatever is about to become visible that hasn't been seen by Groq yet
    const nextSlice   = filtered.slice(page * PAGE_SIZE, nextPage * PAGE_SIZE);
    const toClassify  = nextSlice.filter(j => !classifiedUrls.current.has(j.url));
    if (toClassify.length === 0) return;
    classifyJobs(toClassify).then(scored => {
      scored.forEach(j => classifiedUrls.current.add(j.url));
      const m = new Map(scored.map(j => [j.url, j]));
      setJobs(prev => applyMemory(prev.map(j => m.get(j.url) ?? j)));
    });
  }

  const loading = resolved < SOURCES.length && jobs.length === 0;
  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  // Source health: a feed that breaks (like Workday did) should be visible,
  // not buried in the console.
  const srcLabel     = name => name.replace(/^fetch/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
  const failedSrcs   = Object.entries(sourceStats).filter(([, s]) => s.failed).map(([n]) => srcLabel(n));
  const quietSrcs    = Object.entries(sourceStats).filter(([, s]) => !s.failed && s.passed === 0).map(([n]) => srcLabel(n));
  const healthDetail = [
    failedSrcs.length ? `failed: ${failedSrcs.join(", ")}` : null,
    quietSrcs.length  ? `no matches: ${quietSrcs.join(", ")}` : null,
  ].filter(Boolean).join(" · ");

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
                    <JobCard key={job.id} job={job} onApply={handleApply} viewed={job.url ? viewedUrls.has(job.url) : false} />
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
                : aiFiltering
                  ? `AI filtering ${jobs.length} listings...`
                  : filtersActive
                    ? `${filtered.length} of ${jobs.length} listings match`
                    : `${filtered.length} listings`}
            </p>
            {resolved === SOURCES.length && healthDetail && (
              <p className="jobs-source-health" title="Sources that errored or contributed no jobs this scan">
                {SOURCES.length - failedSrcs.length - quietSrcs.length}/{SOURCES.length} sources contributing · {healthDetail}
              </p>
            )}
          </div>

          <div className="jobs-controls">
            <div className="jobs-filter-row">
              <select
                className="jobs-filter-select"
                value={region}
                onChange={(e) => { setRegion(e.target.value); setProvince(""); setPage(1); }}
                aria-label="Region"
              >
                <option value="canada">Canada wide</option>
                <option value="province">By province...</option>
                <option disabled>──────────</option>
                <option value="ca-us">US hires Canadians</option>
                <option value="ca-global">Global hires Canadians</option>
              </select>

              {region === "province" && (
                <select
                  className="jobs-filter-select"
                  value={province}
                  onChange={(e) => { setProvince(e.target.value); setPage(1); }}
                  aria-label="Province"
                >
                  <option value="">All provinces</option>
                  {PROVINCES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              )}

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
                value={expLevel}
                onChange={(e) => { setExpLevel(e.target.value); setPage(1); }}
                aria-label="Experience level"
              >
                <option value="">Any level</option>
                {EXPERIENCE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              <select
                className="jobs-filter-select"
                value={provider}
                onChange={(e) => { setProvider(e.target.value); setPage(1); }}
                aria-label="Job source"
              >
                <option value="">All sources</option>
                {providers.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <button
                className={`jobs-shuffle-btn${shuffleKey > 0 ? " jobs-shuffle-btn--active" : ""}`}
                onClick={() => { setShuffleKey(k => k + 1); setPage(1); }}
                title="Shuffle order"
                aria-label="Shuffle job order"
              >
                <Shuffle size={14} />
              </button>

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
            <JobCard key={job.id} job={job} onApply={handleApply} viewed={job.url ? viewedUrls.has(job.url) : false} />
          ))}
          {!loading && filtered.length === 0 && (
            <div className="jobs-empty-state">
              <p className="jobs-empty-title">No jobs in this category</p>
              <p className="jobs-empty-sub">
                {tech      && `No ${tech} roles match your other filters. `}
                {expLevel === "0-2" && !tech && `Entry-level postings are limited -- try Any level. `}
                {expLevel === "5+" && !tech && `Try Mid or Any level to see more. `}
                {posted > 0 && `Try a wider date range. `}
                {!tech && !expLevel && !posted && `Try resetting filters.`}
              </p>
              {filtersActive && (
                <button className="jobs-filter-reset jobs-empty-reset" onClick={resetFilters}>
                  Reset filters
                </button>
              )}
            </div>
          )}
        </div>

        {hasMore && (
          <div className="jobs-load-more">
            <button className="jobs-load-more-btn" onClick={handleLoadMore}>
              Load more ({filtered.length - visible.length} remaining)
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
