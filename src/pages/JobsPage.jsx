import { useState, useMemo } from "react";
import AppNav from "../components/layout/AppNav.jsx";
import JobCard from "../components/jobs/JobCard.jsx";
import { isCanadaEligible, getCountry, getDaysOld, getTechStack, getTechTags, getExperienceLevel, TECH_OPTIONS, EXPERIENCE_OPTIONS } from "../lib/jobs/filter.js";
import { useApplications }           from "../hooks/useApplications.js";
import { useJobFeed, JOB_SOURCE_COUNT } from "../hooks/useJobFeed.js";
import { markApplied }               from "../lib/jobs/companyMemory.js";
import { byScore, jobSeed }          from "../lib/jobs/score.js";
import { Shuffle } from "lucide-react";
import "../styles/jobs.css";

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

export default function JobsPage() {
  const { jobs, resolved, sourceStats, aiFiltering, live, liveJobs, polling, startLive, stopLive, classifyMore } = useJobFeed();
  const [region,     setRegion]    = useState("canada");
  const [province,   setProvince]  = useState("");
  const [provider,   setProvider]  = useState("");
  const [posted,     setPosted]    = useState(0);
  const [tech,       setTech]      = useState("");
  const [expLevel,   setExpLevel]  = useState("jr-mid");
  const [shuffleKey, setShuffleKey] = useState(0);
  const [page,       setPage]      = useState(1);
  const [justViewed, setJustViewed] = useState(() => new Set());
  const { apps, addApp } = useApplications();

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
    const ranked = jobs
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

    // Cap each company so a few big employers can't flood the feed - keeps it
    // diverse. The feed is small after the Canada + jr-mid filters, so a cap of
    // 2 stops two or three large employers from eating most of the visible
    // slots. Skipped when you filter by a specific source.
    if (provider) return ranked;
    const perCompany = {};
    return ranked.filter(j => {
      const c = (j.company ?? "").toLowerCase().trim();
      perCompany[c] = (perCompany[c] ?? 0) + 1;
      return perCompany[c] <= 2;
    });
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
    const nextPage = page + 1;
    setPage(nextPage);
    // Classify the slice about to become visible.
    classifyMore(filtered.slice(page * PAGE_SIZE, nextPage * PAGE_SIZE));
  }

  const loading = resolved < JOB_SOURCE_COUNT && jobs.length === 0;
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
              Polls {JOB_SOURCE_COUNT} sources every 5 minutes. You will hear a sound when a new job appears.
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
                ? `Scanning sources... ${resolved}/${JOB_SOURCE_COUNT} done`
                : aiFiltering
                  ? `AI filtering ${jobs.length} listings...`
                  : filtersActive
                    ? `${filtered.length} of ${jobs.length} listings match`
                    : `${filtered.length} listings`}
            </p>
            {resolved === JOB_SOURCE_COUNT && healthDetail && (
              <p className="jobs-source-health" title="Sources that errored or contributed no jobs this scan">
                {JOB_SOURCE_COUNT - failedSrcs.length - quietSrcs.length}/{JOB_SOURCE_COUNT} sources contributing · {healthDetail}
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
