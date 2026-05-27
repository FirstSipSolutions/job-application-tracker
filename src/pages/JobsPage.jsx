import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import AppNav from "../components/layout/AppNav.jsx";
import JobCard from "../components/jobs/JobCard.jsx";
import { fetchSiliconHarbour } from "../lib/jobs/sources/siliconHarbour.js";
import { fetchGreenhouse }     from "../lib/jobs/sources/greenhouse.js";
import { fetchAshby }          from "../lib/jobs/sources/ashby.js";
import { fetchHimalayas }      from "../lib/jobs/sources/himalayas.js";
import { fetchJobicy }         from "../lib/jobs/sources/jobicy.js";
import { fetchRemotive }       from "../lib/jobs/sources/remotive.js";
import { fetchRemoteOk }       from "../lib/jobs/sources/remoteOk.js";
import { fetchLever }          from "../lib/jobs/sources/lever.js";
import { fetchWorkday }        from "../lib/jobs/sources/workday.js";
import { fetchWorkable }       from "../lib/jobs/sources/workable.js";
import { fetchSmartRecruiters }  from "../lib/jobs/sources/smartrecruiters.js";
import { fetchWeWorkRemotely }   from "../lib/jobs/sources/weWorkRemotely.js";
import { fetchRemoteCo }         from "../lib/jobs/sources/remoteCo.js";
import { fetchDigitalNS }        from "../lib/jobs/sources/digitalNovascotia.js";
import { fetchJobBank }          from "../lib/jobs/sources/jobBank.js";
import { fetchTechNL }           from "../lib/jobs/sources/techNL.js";
import { passesFilter, isRemote, isTech, isFresh, isCanadaJob, isCanadaEligible, getCountry, getDaysOld, getTechStack, getTechTags, getExperienceLevel, TECH_OPTIONS, EXPERIENCE_OPTIONS } from "../lib/jobs/filter.js";
import { useApplications }           from "../hooks/useApplications.js";
import { classifyJobs }              from "../lib/llm/classifyJobs.js";
import { applyMemory, markApplied }  from "../lib/jobs/companyMemory.js";
import { Shuffle } from "lucide-react";
import CoverLetterModal from "../components/jobs/CoverLetterModal.jsx";
import "../styles/jobs.css";

const SOURCES   = [fetchSiliconHarbour, fetchGreenhouse, fetchAshby, fetchHimalayas, fetchLever, fetchWorkday, fetchWorkable, fetchSmartRecruiters, fetchWeWorkRemotely, fetchRemoteCo, fetchJobicy, fetchRemotive, fetchRemoteOk, fetchDigitalNS, fetchJobBank, fetchTechNL];
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
  // "province" acts as Canada-wide at the region level; the province sub-filter
  // narrows further inside the useMemo.
  if (region === "canada" || region === "province") {
    // canadaOK() uses Groq's canadaOpen when set, falls back to isCanadaEligible() regex pre-Groq.
    // This makes remote-category sources (Arbeitnow, WeWorkRemotely, Remotive, etc.) visible
    // immediately on load rather than only after Groq has run and confirmed Canada eligibility.
    return isCanadaJob(job) || job.category === "canadian" || canadaOK(job);
  }
  if (region === "ca-us")     return canadaOK(job) && getCountry(job) === "US";
  if (region === "ca-global") return canadaOK(job) && (getCountry(job) === "Global" || getCountry(job) === null);
  return true; // "all"
}

function dedup(arr) {
  const seen = new Set();
  return arr.filter(j => {
    if (!j.url || seen.has(j.url)) return false;
    seen.add(j.url);
    return true;
  });
}

// Ranks jobs so the most hirable ones surface first.
// Canadian companies and global-remote teams come before ambiguous US postings.
// Within the same tier, fresher postings win.
function scoreJob(job) {
  let score = 0;

  // groqExp is the primary seniority signal -- Groq read the actual description.
  // sourceExp is a pre-Groq signal from sources that declare seniority directly (Himalayas).
  // Title patterns are the fallback for jobs neither Groq nor the source has classified yet.
  const exp   = job.groqExp ?? job.sourceExp;
  const title = job.title ?? "";
  // Target: jr and mid both surface well (0–3 years sweet spot)
  if (exp === "0-2") {
    score += 35;
  } else if (exp === "2-5") {
    score += 30;
  } else if (exp === "5+") {
    score -= 40;
  } else {
    // No exp signal yet -- use title keywords as a rough proxy
    if      (/\bjunior\b|\bjr\.?\b|\bentry[- ]?level\b|\bnew\s*grad\b|\bassociate\s+(software|developer|engineer)\b/i.test(title)) score += 32;
    else if (/\bmid[- ]?level\b|\bintermediate\b/i.test(title)) score += 28;
    else if (/\bstaff\b|\bprincipal\b|\bdistinguished\b|\bhead\s+of\b|\bvp\b|\bdirector\b/i.test(title)) score -= 55;
    else if (/\bsenior\b|\bsr\.?\b|\blead\b/i.test(title)) score -= 30;
  }

  // Canada confidence
  if (job.category === "canadian")           score += 30;
  else if (job._canadaSource === "source")   score += 27;
  else if (job.source === "Jobicy")          score += 24;
  else if (job.category === "global-remote") score += 20;
  else if (job.canadaOpen === true)          score += 12;
  else if (job.canadaOpen === false)         score -= 20;

  // Fullstack title bonus — matches user's target role
  if (/\bfull[- ]?stack\b/i.test(title)) score += 12;

  // Quality signals
  if (job.salary)             score += 8;
  if (job.groqSal)            score += 10; // Groq detected salary in description
  if (job.descriptionSnippet) score += 3;

  // ATS-direct source bonus — these are real postings, not aggregator noise
  const atsSource = ["Greenhouse","Lever","Ashby"].includes(job.source);
  if (atsSource) score += 8;

  // Aggregator penalty when canadaOpen not confirmed — high false-positive rate
  const aggregator = ["RemoteOK","Arbeitnow","Jobicy"].includes(job.source);
  if (aggregator && job.canadaOpen !== true && job.category !== "canadian") score -= 8;

  // US-only location penalty when Canada status unknown
  if (job.canadaOpen === undefined && job.category !== "canadian" && job.category !== "global-remote") {
    const loc = (job.location ?? "").toLowerCase();
    if (/\bus\b|\busa\b|united states|san francisco|new york|seattle|austin|boston|los angeles|chicago/i.test(loc)
      && !/canada|worldwide|global/i.test(loc)) score -= 10;
  }

  // Recency
  const days = (Date.now() - new Date(job.postedAt ?? 0)) / 864e5;
  if      (days <= 1)  score += 15;
  else if (days <= 3)  score += 10;
  else if (days <= 7)  score +=  5;

  return score;
}

function byScore() {
  return (a, b) => scoreJob(b) - scoreJob(a);
}

function byNewest(a, b) {
  return new Date(b.postedAt ?? 0) - new Date(a.postedAt ?? 0);
}

// Deterministic per-job hash for shuffle -- same shuffleKey always gives the same order.
function jobSeed(seed, id) {
  let h = seed * 2654435761;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 0x9e3779b9);
  }
  return (h ^ h >>> 16) >>> 0;
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
    try { localStorage.removeItem(JOBS_CACHE_KEY); } catch {}
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
  const [jobs,       setJobs]      = useState([]);
  const [resolved,   setResolved]  = useState(0);
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
  const [coverJob,    setCoverJob]    = useState(null);
  const seenUrls       = useRef(new Set());
  const classifiedUrls = useRef(new Set());
  const pollTimer      = useRef(null);
  const { apps, addApp } = useApplications();

  useEffect(() => {
    let active = true;
    let done   = 0;
    const collected = [];

    // Show cached jobs instantly on every nav - no blank page while sources load.
    // Groq fields (canadaOpen, groqStack, groqExp) are baked into cached objects
    // so filters work immediately without re-classifying.
    const cached    = readJobsCache();
    const cachedMap = new Map(cached.map(j => [j.url, j]));
    if (cached.length > 0) {
      cached.forEach(j => {
        seenUrls.current.add(j.url);
        if (j.canadaOpen !== undefined || j.groqStack || j.groqExp) {
          classifiedUrls.current.add(j.url);
        }
      });
      setJobs(applyMemory(cached.sort(byScore())));
    }

    SOURCES.forEach(fn => {
      fn()
        .then(raw => {
          if (!active) return;
          const fresh    = raw.filter(passesFilter);
          const noRemote = raw.filter(j => !isRemote(j)).length;
          const noTech   = raw.filter(j => isRemote(j) && !isTech(j)).length;
          const stale    = raw.filter(j => isRemote(j) && isTech(j) && !isFresh(j)).length;
          console.log(`[Source] ${fn.name}: ${raw.length} raw -> ${fresh.length} passed (dropped: ${noRemote} not-remote, ${noTech} not-tech, ${stale} stale)`);
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
        .catch(err => console.error(`[Source] ${fn.name} failed:`, err))
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
            try { localStorage.setItem("cv-vault-hot-jobs", JSON.stringify({ jobs: hotJobs, savedAt: Date.now() })); } catch {}

            // Classify ALL uncached jobs — filters need groqExp to work correctly
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

  function logAndOpen(job, coverLetter) {
    window.open(job.url, "_blank", "noopener,noreferrer");
    markApplied(job.company); // strongest Canada signal: you clicked Apply
    addApp({
      url:          job.url,
      company:      job.company,
      role:         job.title,
      status:       "Viewed",
      date:         new Date().toISOString().slice(0, 10),
      cover_letter: coverLetter ?? null,
      notes:        [
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

  function handleApply(job) {
    setCoverJob(job);
  }

  function handleCoverConfirm(coverLetter) {
    logAndOpen(coverJob, coverLetter);
    setCoverJob(null);
  }

  const providers = useMemo(() => {
    const set = new Set(jobs.map(j => j.source).filter(Boolean));
    return [...set].sort();
  }, [jobs]);

  const coveredUrls = useMemo(
    () => new Set(apps.filter(a => a.cover_letter && a.url).map(a => a.url)),
    [apps]
  );

  const filtered = useMemo(() => {
    const sortFn = shuffleKey > 0
      ? (a, b) => jobSeed(shuffleKey, a.url ?? a.id) - jobSeed(shuffleKey, b.url ?? b.id)
      : byScore();
    return jobs
      .filter(j => {
        if (j.url && coveredUrls.has(j.url)) return false;
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
            if (e === expLevel) return true;   // Groq confirmed match — short-circuit
            if (e !== null)     return false;  // Groq says different tier
            // No Groq data yet — fall back to title keywords
            if (expLevel === "0-2") return isJunior;
            if (expLevel === "5+")  return isSenior;
            return !isSenior && !isJunior;     // mid: include anything with no strong signal
          }
        }
        return true;
      })
      .sort(sortFn);
  }, [jobs, region, province, provider, posted, tech, expLevel, shuffleKey, coveredUrls]);

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
                    <JobCard key={job.id} job={job} onApply={handleApply} />
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
                <option disabled>──────────</option>
                <option value="all">All remote</option>
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
            <JobCard key={job.id} job={job} onApply={handleApply} />
          ))}
          {!loading && filtered.length === 0 && (
            <div className="jobs-empty-state">
              <p className="jobs-empty-title">No jobs in this category</p>
              <p className="jobs-empty-sub">
                {tech      && `No ${tech} roles match your other filters. `}
                {expLevel === "0-2" && !tech && `Entry-level postings are limited -- try Any level. `}
                {expLevel === "5+" && !tech && `Try Mid or Any level to see more. `}
                {posted > 0 && `Try a wider date range. `}
                {!tech && !expLevel && !posted && `Try "All remote" or reset filters.`}
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

      {coverJob && (
        <CoverLetterModal
          job={coverJob}
          onConfirm={handleCoverConfirm}
          onClose={() => setCoverJob(null)}
        />
      )}
    </div>
  );
}
