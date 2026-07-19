// Shared filter applied to every job regardless of source.
// All conditions must pass or the job is dropped.
//
// isTech is a two-layer title filter: NON_DEV rejects first (PM/design/etc.
// with tech-adjacent words), then the title must match a DEV_ROLE pattern.
// The pattern lists live in patterns.js; Groq refines what the regex misses.
import { NON_DEV, DEV_ROLE, TECH_STACKS, TAG_PATTERNS } from "./patterns.js";

// Drop jobs older than this. Cuts ghost jobs and filled roles.
const MAX_AGE_DAYS = 14;

export function isFresh(job) {
  if (!job.postedAt) return false;
  const days = (Date.now() - new Date(job.postedAt)) / 864e5;
  return days <= MAX_AGE_DAYS;
}

// Different ATSs store remote in workplaceType vs location.
// Rejects hybrid/on-site. Accepts "remote", "anywhere", "worldwide" as equivalent.
export function isRemote(job) {
  const wt  = job.workplaceType ?? "";
  const loc = job.location ?? "";
  const combined = `${wt} ${loc}`;
  if (/\bon[- ]?site\b|\bhybrid\b|\bin[- ]?office\b|\bin[- ]?person\b/i.test(combined)) return false;
  // "Remote/Hybrid" or "Hybrid/Remote" labels → hybrid, not fully remote
  if (/remote[/|]hybrid|hybrid[/|]remote/i.test(combined)) return false;
  return /remote|anywhere|worldwide|telecommut/i.test(combined);
}

export function isTech(job) {
  const title = job.title ?? "";
  if (NON_DEV.some(re => re.test(title)))  return false;
  return DEV_ROLE.some(re => re.test(title));
}

// Canada ingest gate: at least one positive (or non-negative) Canada signal.
export function passesCanadaGate(job) {
  return job.category === "canadian"
    || job._canadaSource === "source"
    || isCanadaJob(job)
    || job.canadaOpen === true
    || isCanadaEligible(job);
}

export function passesFilter(job) {
  // Canadian-category sources (DNS, JobBank, SiliconHarbour, TechNL) include
  // intentionally local NS/NL/CA postings - skip the remote gate for those.
  if (job.category !== "canadian" && !isRemote(job)) return false;
  // sourceTech: curated tech boards (TechNL) where every posting is relevant.
  if (!job.sourceTech && !isTech(job)) return false;
  return isFresh(job) && passesCanadaGate(job);
}

// ── UI filter helpers ─────────────────────────────────────────────

// Returns true when the job explicitly mentions Canada.
export function isCanadaJob(job) {
  const text = `${job.location ?? ""} ${job.workplaceType ?? ""}`.toLowerCase();
  return /canad/.test(text);
}

// Best-guess country bucket from location + workplaceType.
// Returns "US", "CA", "UK", "EU", "Global", or null if unclassifiable.
export function getCountry(job) {
  const text = `${job.location ?? ""} ${job.workplaceType ?? ""}`.toLowerCase();
  if (!text.trim()) return null;
  if (/worldwide|anywhere|global/.test(text)) return "Global";
  if (/canad/.test(text)) return "CA";
  if (/\bus\b|usa|united states|u\.s\./.test(text)) return "US";
  if (/\buk\b|united kingdom|england|britain/.test(text)) return "UK";
  if (/europe|\beu\b|germany|france|spain|netherlands|portugal|poland|ireland|sweden|finland|denmark/.test(text)) return "EU";
  return null;
}

// Pre-Groq Canada check - used as fallback before AI scoring runs.
// Stricter than before: blocks obvious US-scoped remote patterns, not just
// explicit "US only" language. Groq overrides this once it finishes.
export function isCanadaEligible(job) {
  const loc = `${job.location ?? ""} ${job.workplaceType ?? ""}`.toLowerCase();

  // Explicit exclusions
  if (/\bus\s*[-/]?\s*only\b|united states only|usa only/i.test(loc)) return false;
  if (/us\s+citizen|us\s+work\s+authorization|authorized.*work.*us/i.test(loc)) return false;
  if (/\beu\s*[-/]?\s*only\b|europe\s+only|\buk\s*[-/]?\s*only\b|\bemea\b|\bapac\b|asia\s+pacific/i.test(loc)) return false;

  // "Remote (US)", "Remote - US", "Remote, US", "US Remote", "Remote United States"
  if (/\bremote\s*[,(-]\s*(us|usa|united states)\b/i.test(loc)) return false;
  if (/\b(us|usa|united states)\s*[),-]?\s*remote\b/i.test(loc)) return false;

  // US state as the only location with no remote/worldwide qualifier
  if (/\b(california|texas|new york|washington state|florida|colorado|illinois|georgia|massachusetts|oregon|nevada|arizona|virginia|north carolina)\b/i.test(loc)
    && !/remote|worldwide|canada|global/i.test(loc)) return false;

  return true;
}

// Days since posted. Infinity when missing so it never passes a date filter.
export function getDaysOld(job) {
  if (!job.postedAt) return Infinity;
  return (Date.now() - new Date(job.postedAt)) / 864e5;
}

// Tech stack tagging - title first, description snippet as fallback.
// First match wins. Title takes priority so "Node Engineer" doesn't get
// tagged as React just because the description mentions a React frontend.
export function getTechStack(job) {
  // Groq read the full description - trust it first
  if (job.groqStack) return job.groqStack;
  const title = job.title ?? "";
  for (const [key, re] of Object.entries(TECH_STACKS)) {
    if (re.test(title)) return key;
  }
  const desc = job.descriptionSnippet ?? "";
  if (desc) {
    for (const [key, re] of Object.entries(TECH_STACKS)) {
      if (re.test(desc)) return key;
    }
  }
  return null;
}

export const TECH_OPTIONS = Object.keys(TECH_STACKS);

// Returns up to 3 tech tags found in title then description snippet.
// Title matches take priority; description fills remaining slots.
export function getTechTags(job) {
  const title   = job.title ?? "";
  const snippet = job.descriptionSnippet ?? "";
  const found   = [];
  const seen    = new Set();

  for (const [label, re] of TAG_PATTERNS) {
    if (found.length >= 3) break;
    if (!seen.has(label) && re.test(title)) { found.push(label); seen.add(label); }
  }
  for (const [label, re] of TAG_PATTERNS) {
    if (found.length >= 3) break;
    if (!seen.has(label) && re.test(snippet)) { found.push(label); seen.add(label); }
  }
  return found;
}

// Returns experience tier based on years mentioned in the description or title signals.
// "0-2" = entry level, "2-5" = mid, "5+" = senior, null = not stated in posting.
export function getExperienceLevel(job) {
  // Groq read the full description - trust it first; sourceExp is a pre-Groq API signal
  if (job.groqExp) return job.groqExp;
  if (job.sourceExp) return job.sourceExp;

  const snippet = job.descriptionSnippet ?? "";
  const title   = job.title ?? "";

  // Explicit years in snippet -- most reliable pre-Groq signal.
  // Second pattern catches "at least N years", "minimum N years", "over N years".
  const m = snippet.match(/(\d+)(\+)?\s*(?:[-–to]+\s*(\d+)\s*)?years?\s*(?:of\s+)?(?:experience|exp\b)/i)
         || snippet.match(/(?:at\s+least|minimum|min\.?|over)\s+(\d+)(\+)?\s*years?/i);
  if (m) {
    const min     = parseInt(m[1], 10);
    const hasPlus = !!m[2];
    const max     = m[3] != null ? parseInt(m[3], 10) : null;
    // "5+ years" or bare "5 years" → senior
    if ((hasPlus && min >= 5) || min >= 5) return "5+";
    if (max !== null) {
      // It's a range like "2-5 years" or "1-3 years"
      if (max <= 3) return "0-2";   // "1-3 years" → entry
      if (min >= 4) return "5+";    // "4-7 years" → senior (min too high)
      return "2-5";                  // "2-5", "3-5" → mid
    }
    // Single number, no range
    if (min <= 2) return "0-2";
    if (min >= 4) return "5+";  // "4 years" min is too high for jr/mid
    return "2-5";
  }

  // Entry-level keywords
  if (/new\s*grad|entry[- ]level|0\s*[-–]\s*[12]\s*year|no\s+experience\s+required/i.test(snippet + " " + title)) return "0-2";
  if (/\bjunior\b|\bjr\.?\b|\bassociate\s+(software|developer|engineer)\b/i.test(title)) return "0-2";

  // Mid-level keywords in title
  if (/\bmid[- ]?level\b|\bintermediate\b/i.test(title)) return "2-5";

  // Senior-level keywords in title.
  // Groq overrides this once it reads the full description. Title is the best
  // pre-Groq signal -- "Senior Engineer" almost always means 5+ years required.
  if (/\b(senior|sr\.?|staff|principal|distinguished|lead|head\s+of|vp|director|architect)\b/i.test(title)) return "5+";

  return null;
}

export const EXPERIENCE_OPTIONS = [
  { value: "jr-mid", label: "Jr/Mid (0-3 yrs)" },
  { value: "0-2",    label: "0-2 yrs (Entry)" },
  { value: "2-5",    label: "2-5 yrs (Mid)" },
  { value: "5+",     label: "5+ yrs (Senior)" },
];
