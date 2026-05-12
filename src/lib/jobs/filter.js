// Shared filter applied to every job regardless of source.
// All conditions must pass or the job is dropped.

const BLOCK_KEYWORDS = new Set([
  "marketing", "sales", "recruiter", "recruiting", "hr", "legal",
  "counsel", "finance", "accounting", "operations", "bizdev",
  "partnerships", "communications", "pr", "social", "seo", "growth",
  "creative", "brand", "copywriter", "content",
]);

const TECH_KEYWORDS = new Set([
  "developer", "engineer", "software", "data", "designer", "design",
  "frontend", "backend", "fullstack", "full-stack", "devops", "qa",
  "analyst", "product", "tech", "web", "mobile", "cloud", "security",
  "architect", "platform", "infrastructure", "machine", "ai", "ml",
  "sdet", "automation", "reliability", "sre", "embedded", "firmware",
  "typescript", "javascript", "python", "golang", "rust", "java",
]);

// Drop jobs older than this. Cuts ghost jobs and filled roles.
const MAX_AGE_DAYS = 14;

export function isFresh(job) {
  if (!job.postedAt) return false;
  const days = (Date.now() - new Date(job.postedAt)) / 864e5;
  return days <= MAX_AGE_DAYS;
}

// Different ATSs store remote in workplaceType vs location.
export function isRemote(job) {
  return /remote/i.test(job.workplaceType ?? "") || /remote/i.test(job.location ?? "");
}

export function isTech(job) {
  const words = (job.title ?? "").toLowerCase().split(/\W+/);
  if (words.some(w => BLOCK_KEYWORDS.has(w))) return false;
  return words.some(w => TECH_KEYWORDS.has(w));
}

export function passesFilter(job) {
  return isRemote(job) && isTech(job) && isFresh(job);
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

// Lenient Canadian-eligible check. Only drops jobs that explicitly exclude
// Canadians (US-only, US citizen required, etc). Silent listings pass through
// since the data rarely says "we hire Canadians" outright.
export function isCanadaEligible(job) {
  const text = `${job.location ?? ""} ${job.workplaceType ?? ""}`.toLowerCase();
  // Explicit exclusions: drop these
  if (/\bus\s*[-/]?\s*only\b|united states only|usa only/.test(text)) return false;
  if (/us\s+citizen|us\s+work\s+authorization|must.*authorized.*us/.test(text)) return false;
  if (/^remote\s*[-(]\s*(us|usa|united states)\b/.test(text)) return false;
  if (/\beu\s*[-/]?\s*only\b|europe only/.test(text)) return false;
  if (/\buk\s*[-/]?\s*only\b/.test(text)) return false;
  // Otherwise let it through, including silent "Remote" and unknown locations
  return true;
}

// Days since posted. Infinity when missing so it never passes a date filter.
export function getDaysOld(job) {
  if (!job.postedAt) return Infinity;
  return (Date.now() - new Date(job.postedAt)) / 864e5;
}

// Tech stack tagging from the job title. First match wins.
const TECH_STACKS = {
  React:    /\breact\b|\bjsx\b|\bnext\.?js\b/i,
  Vue:      /\bvue\b|\bnuxt\b/i,
  Angular:  /\bangular\b/i,
  Python:   /\bpython\b|\bdjango\b|\bflask\b|\bfastapi\b/i,
  Node:     /\bnode\b|\bnest\.?js\b|\bexpress\b/i,
  TypeScript: /\btypescript\b|\bts\b/i,
  Go:       /\bgolang\b|\bgo\s+(developer|engineer|programmer)/i,
  Rust:     /\brust\b/i,
  Java:     /\bjava\b|\bspring\b|\bkotlin\b/i,
  Mobile:   /\bios\b|\bandroid\b|\bswift\b|\bflutter\b|\breact\s+native\b/i,
  DevOps:   /\bdevops\b|\bsre\b|\bkubernetes\b|\baws\b|\bgcp\b|\bazure\b|\bplatform\b|\binfrastructure\b/i,
  Data:     /\bdata\s+engineer\b|\bml\s+engineer\b|\bmachine\s+learning\b|\bai\s+engineer\b/i,
};

export function getTechStack(job) {
  const t = (job.title ?? "");
  for (const [key, re] of Object.entries(TECH_STACKS)) {
    if (re.test(t)) return key;
  }
  return null;
}

export const TECH_OPTIONS = Object.keys(TECH_STACKS);

// Returns "Junior", "Mid", or "Senior" based on title keywords.
export function getSeniority(job) {
  const t = (job.title ?? "").toLowerCase();
  if (/\bsenior\b|\bsr\.?\b|\bstaff\b|\bprincipal\b|\blead\b/.test(t)) return "Senior";
  if (/\bjunior\b|\bjr\.?\b|\bentry\b|\bgraduate\b|\bassociate\b|\bintern\b/.test(t)) return "Junior";
  return "Mid";
}

export const SENIORITY_OPTIONS = ["Junior", "Mid", "Senior"];
