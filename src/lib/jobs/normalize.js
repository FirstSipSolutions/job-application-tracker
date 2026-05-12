// Maps each source's raw job shape into one common format.
// Every source goes through here before being filtered or displayed.

function isRemoteLoc(str) {
  if (!str) return false;
  return /remote|anywhere|worldwide/i.test(str);
}

function detectCurrency(str) {
  if (!str) return null;
  if (/CAD|C\$|CA\$/.test(str)) return "CAD";
  if (/\$|USD/.test(str)) return "USD";
  return null;
}

function extractSalary(text) {
  if (!text) return null;
  const clean = text.replace(/<[^>]+>/g, " ");
  const m = clean.match(/\$[\d,.]+k?\s*[-–to]+\s*\$[\d,.]+k?(?:\s*(?:USD|CAD|CAD\/yr|USD\/yr))?/i)
         || clean.match(/(?:CAD|USD)\s*[\d,]+\s*[-–]\s*[\d,]+/i);
  return m ? m[0].replace(/\s+/g, " ").trim() : null;
}

// ── Silicon Harbour ──────────────────────────────────────────────────────────

export function fromSiliconHarbour(job) {
  return {
    id:            `sh-${job.id}`,
    title:         job.title ?? "",
    company:       job.companyName ?? "",
    location:      job.location ?? "",
    workplaceType: job.workplaceType ?? "",
    salary:        job.salaryRange ?? null,
    postedAt:      job.postedAt ?? job.createdAt,
    url:           job.url ?? job.detailUrl ?? "",
    source:        "Silicon Harbour",
  };
}

// ── Jobicy ───────────────────────────────────────────────────────────────────

export function fromJobicy(job) {
  return {
    id:            `jc-${job.id}`,
    title:         job.jobTitle ?? "",
    company:       job.companyName ?? "",
    location:      job.jobGeo ?? "",
    workplaceType: "Remote",
    salary:        job.salaryMin ? `${job.salaryMin}-${job.salaryMax} ${job.salaryCurrency}` : null,
    postedAt:      job.pubDate,
    url:           job.url ?? "",
    source:        "Jobicy",
  };
}

// ── Greenhouse ───────────────────────────────────────────────────────────────

export function fromGreenhouse(job, companyName, category) {
  const loc = job.location?.name ?? "";
  // Greenhouse rarely includes salary in the base listing, check metadata array
  const salaryMeta = (job.metadata ?? []).find(m =>
    /salary|compensation|pay/i.test(m.name) && m.value
  );
  const salary = salaryMeta?.value ?? null;
  return {
    id:            `gh-${job.id}`,
    title:         job.title ?? "",
    company:       companyName,
    location:      loc,
    workplaceType: isRemoteLoc(loc) ? "Remote" : loc,
    salary,
    currency:      detectCurrency(salary),
    postedAt:      job.first_published ?? job.updated_at,
    url:           job.absolute_url ?? "",
    source:        "Greenhouse",
    category,
  };
}

// ── Ashby ─────────────────────────────────────────────────────────────────────

export function fromAshby(job, companyName, category) {
  const salary = job.compensation?.compensationTierGuide ?? extractSalary(job.descriptionHtml ?? "");
  return {
    id:            `ab-${job.id}`,
    title:         job.title ?? "",
    company:       companyName,
    location:      job.location ?? "",
    workplaceType: job.isRemote || /remote/i.test(job.workplaceType ?? "") ? "Remote" : job.workplaceType ?? "",
    salary,
    currency:      detectCurrency(salary),
    postedAt:      job.publishedAt,
    url:           job.jobUrl ?? "",
    source:        "Ashby",
    category,
  };
}
