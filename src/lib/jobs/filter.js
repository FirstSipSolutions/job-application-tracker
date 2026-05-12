// Shared filter applied to every job regardless of source.
// All three conditions must pass or the job is dropped.

// DATA STRUCTURE: Set
// Checked against every word in the job title on every filter pass.
// Set.has() is O(1) vs array .includes() O(N).
const TECH_KEYWORDS = new Set([
  "developer", "engineer", "software", "data", "designer", "design",
  "frontend", "backend", "fullstack", "full-stack", "devops", "qa",
  "analyst", "product", "tech", "web", "mobile", "cloud", "security",
  "architect", "platform", "infrastructure", "machine", "ai", "ml",
]);

// Only jobs posted within this many days are shown.
// Cuts ghost jobs and filled roles that were never taken down.
const MAX_AGE_DAYS = 14;

export function isFresh(job) {
  if (!job.postedAt) return true;
  const days = (Date.now() - new Date(job.postedAt)) / 864e5;
  return days <= MAX_AGE_DAYS;
}

export function isRemote(job) {
  return job.workplaceType?.toLowerCase() === "remote";
}

export function isTech(job) {
  const words = (job.title ?? "").toLowerCase().split(/\s+/);
  return words.some(w => TECH_KEYWORDS.has(w));
}

export function passesFilter(job) {
  return isRemote(job) && isTech(job) && isFresh(job);
}
