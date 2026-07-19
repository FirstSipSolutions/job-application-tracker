/*
 * Job ranking.
 * Scores a listing so the most hirable ones surface first, plus the
 * comparators the feed sorts with. Pure functions, no React.
 */

// Canadian and global-remote roles beat ambiguous US ones; within a tier,
// better-fit and fresher postings win.
export function scoreJob(job) {
  let score = 0;

  // groqExp is the strongest seniority signal - Groq read the full description.
  // sourceExp is a pre-Groq signal from boards that state seniority (Himalayas).
  // Title keywords are the fallback when nothing has classified the job yet.
  const exp   = job.groqExp ?? job.sourceExp;
  const title = job.title ?? "";

  // jr and mid both surface well; 0-3 years is the sweet spot.
  if (exp === "0-2") {
    score += 35;
  } else if (exp === "2-5") {
    score += 30;
  } else if (exp === "5+") {
    score -= 40;
  } else {
    // No signal yet - lean on the title.
    if      (/\bjunior\b|\bjr\.?\b|\bentry[- ]?level\b|\bnew\s*grad\b|\bassociate\s+(software|developer|engineer)\b/i.test(title)) score += 32;
    else if (/\bmid[- ]?level\b|\bintermediate\b/i.test(title)) score += 28;
    else if (/\bstaff\b|\bprincipal\b|\bdistinguished\b|\bhead\s+of\b|\bvp\b|\bdirector\b/i.test(title)) score -= 55;
    else if (/\bsenior\b|\bsr\.?\b|\blead\b/i.test(title)) score -= 30;
  }

  // Canada confidence
  if (job.category === "canadian")           score += 15;
  else if (job._canadaSource === "source")   score += 27;
  else if (job.source === "Jobicy")          score += 24;
  else if (job.category === "global-remote") score += 20;
  else if (job.canadaOpen === true)          score += 12;
  else if (job.canadaOpen === false)         score -= 20;

  // Fullstack bonus - matches my target role.
  if (/\bfull[- ]?stack\b/i.test(title)) score += 12;

  // Quality signals
  if (job.salary)             score += 8;
  if (job.groqSal)            score += 10;
  if (job.descriptionSnippet) score += 3;

  // Direct-from-ATS listings are real postings, not aggregator noise.
  const atsSource = ["Greenhouse","Lever","Ashby"].includes(job.source);
  if (atsSource) score += 8;

  // Aggregators without a confirmed Canada signal have a high false-positive rate.
  const aggregator = ["RemoteOK","Jobicy"].includes(job.source);
  if (aggregator && job.canadaOpen !== true && job.category !== "canadian") score -= 8;

  // Recency
  const days = (Date.now() - new Date(job.postedAt ?? 0)) / 864e5;
  if      (days <= 1)  score += 15;
  else if (days <= 3)  score += 10;
  else if (days <= 7)  score +=  5;

  return score;
}

// Highest score first.
export function byScore() {
  return (a, b) => scoreJob(b) - scoreJob(a);
}

// Newest first.
export function byNewest(a, b) {
  return new Date(b.postedAt ?? 0) - new Date(a.postedAt ?? 0);
}

// Deterministic per-job hash so a given shuffle key always yields the same order.
export function jobSeed(seed, id) {
  let h = seed * 2654435761;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 0x9e3779b9);
  }
  return (h ^ h >>> 16) >>> 0;
}
