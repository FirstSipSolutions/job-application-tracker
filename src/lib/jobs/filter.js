// Shared filter applied to every job regardless of source.
// All conditions must pass or the job is dropped.

const TECH_KEYWORDS = new Set([
  "developer", "engineer", "software", "data", "designer", "design",
  "frontend", "backend", "fullstack", "full-stack", "devops", "qa",
  "analyst", "product", "tech", "web", "mobile", "cloud", "security",
  "architect", "platform", "infrastructure", "machine", "ai", "ml",
  "sdet", "automation", "reliability", "sre", "embedded", "firmware",
  "typescript", "javascript", "python", "golang", "rust", "java",
]);

// Drop jobs older than this — cuts ghost jobs and filled roles.
const MAX_AGE_DAYS = 14;

export function isFresh(job) {
  if (!job.postedAt) return true;
  const days = (Date.now() - new Date(job.postedAt)) / 864e5;
  return days <= MAX_AGE_DAYS;
}

// Check both workplaceType and location — different ATSs store this differently.
export function isRemote(job) {
  return /remote/i.test(job.workplaceType ?? "") || /remote/i.test(job.location ?? "");
}

export function isTech(job) {
  const words = (job.title ?? "").toLowerCase().split(/\W+/);
  return words.some(w => TECH_KEYWORDS.has(w));
}

export function passesFilter(job) {
  return isRemote(job) && isTech(job) && isFresh(job);
}
