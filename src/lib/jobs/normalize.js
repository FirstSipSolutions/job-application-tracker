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

// Extracts the most signal-rich plain-text snippet from a job description HTML.
// Priority: requirements/qualifications section > middle of text > first 400 chars.
// The requirements section has experience years, tech stack, and work-auth language —
// all more useful than the company intro that always appears at the top.
function toSnippet(html) {
  if (!html) return null;
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#\d]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;

  // Try to find a requirements/qualifications section by header keyword
  const m = text.match(
    /(?:requirements|qualifications|what you(?:'ll)? bring|what we(?:'re)? looking for|you(?:'ll)? have|you bring|you must have|about you)[:\s]+(.{80,})/i
  );
  if (m) return m[1].trim().slice(0, 500);

  // Fall back: middle of the description (requirements tend to be 50–80% through)
  if (text.length > 800) return text.slice(Math.floor(text.length * 0.5), Math.floor(text.length * 0.5) + 500).trim();

  return text.slice(0, 400) || null;
}

// Decodes Remotive's candidate_required_location into a definitive Canada signal.
// Returns true (open), false (excluded), or undefined (ambiguous — let Groq decide).
function remotiveCanadaOpen(location) {
  if (!location) return undefined;
  const l = location.toLowerCase();
  if (/worldwide|anywhere|global|no restriction|international/i.test(l)) return true;
  if (/north america|americas/i.test(l)) return true;
  if (/canada/i.test(l)) return true;
  // US-only without Canada mentioned
  if (/\busa?\b|united states/i.test(l) && !/canada|north america/i.test(l)) return false;
  if (/\beurope?\b|\beu\b|\buk\b|latin america/i.test(l)) return false;
  return undefined; // ambiguous
}

// ── Silicon Harbour ──────────────────────────────────────────────────────────

export function fromSiliconHarbour(job) {
  return {
    id:                 `sh-${job.id}`,
    title:              job.title ?? "",
    company:            job.companyName ?? "",
    location:           job.location ?? "",
    workplaceType:      "Remote", // filtered at source with &workplaceType=remote
    salary:             job.salaryRange ?? null,
    postedAt:           job.postedAt ?? job.createdAt,
    url:                job.url ?? job.detailUrl ?? "",
    source:             "Silicon Harbour",
    category:           "canadian",
    descriptionSnippet: toSnippet(job.description ?? ""),
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
    descriptionSnippet: toSnippet(job.content ?? ""),
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
    descriptionSnippet: toSnippet(job.descriptionHtml ?? ""),
  };
}

// ── Lever ─────────────────────────────────────────────────────────────────────

export function fromLever(job, companyName, category) {
  const loc = job.categories?.location ?? "";
  return {
    id:                 `lv-${job.id}`,
    title:              job.text ?? "",
    company:            companyName,
    location:           loc,
    workplaceType:      isRemoteLoc(loc) ? "Remote" : loc,
    salary:             extractSalary(job.description ?? ""),
    currency:           null,
    postedAt:           job.createdAt ? new Date(job.createdAt).toISOString() : null,
    url:                job.hostedUrl ?? "",
    source:             "Lever",
    category,
    // Lever returns full description HTML — best source we have for work-auth language
    descriptionSnippet: toSnippet((job.description ?? "") + " " + (job.additional ?? "")),
  };
}

// ── Remotive ──────────────────────────────────────────────────────────────────

export function fromRemotive(job) {
  const canadaOpen = remotiveCanadaOpen(job.candidate_required_location ?? "");
  return {
    id:            `rm-${job.id}`,
    title:         job.title ?? "",
    company:       job.company_name ?? "",
    location:      job.candidate_required_location || "Remote",
    workplaceType: "Remote",
    salary:        job.salary ?? null,
    currency:      detectCurrency(job.salary ?? ""),
    postedAt:      job.publication_date ?? null,
    url:           job.url ?? "",
    source:        "Remotive",
    category:      "remote",
    descriptionSnippet: toSnippet(job.description ?? ""),
    canadaOpen,
    _canadaSource:      canadaOpen !== undefined ? "source" : undefined,
  };
}

// ── WeWorkRemotely (RSS) ──────────────────────────────────────────────────────

function rssText(item, tag) {
  return item.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";
}

function parseRSSDate(str) {
  if (!str) return null;
  try { return new Date(str).toISOString(); } catch { return null; }
}

export function fromWeWorkRemotely(item) {
  const titleRaw   = rssText(item, "title");
  // Title format: "Category: Job Title at Company Name"
  const withoutCat = titleRaw.includes(": ") ? titleRaw.slice(titleRaw.indexOf(": ") + 2) : titleRaw;
  const lastAt     = withoutCat.lastIndexOf(" at ");
  const title      = lastAt > 0 ? withoutCat.slice(0, lastAt).trim() : withoutCat;
  const company    = lastAt > 0 ? withoutCat.slice(lastAt + 4).trim() : "";
  const link       = rssText(item, "link") || rssText(item, "guid");
  const region     = rssText(item, "region") || "Remote";
  const desc       = rssText(item, "description");
  return {
    id:                 `wwr-${link.split("/").filter(Boolean).pop() ?? Date.now()}`,
    title,
    company,
    location:           region,
    workplaceType:      "Remote",
    salary:             null,
    postedAt:           parseRSSDate(rssText(item, "pubDate")),
    url:                link,
    source:             "WeWorkRemotely",
    category:           "remote",
    descriptionSnippet: toSnippet(desc),
  };
}

// ── Digital Nova Scotia (WordPress REST API) ──────────────────────────────

function dnsCompany(html) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&[a-z#\d]+;/gi, " ").replace(/\s+/g, " ").trim();
  const idx  = text.search(/COMPANY\s+DESCRIPTION/i);
  if (idx === -1) return null;
  const after = text.slice(idx).replace(/COMPANY\s+DESCRIPTION\s*/i, "").trim();
  // Company name ends before the first verb that starts its description sentence
  const m = after.match(/^([^.]+?)(?:\s+(?:is|was|are|has|provides|offers|creates|develops|builds|specializes|focuses)\b|[.,])/i);
  return (m ? m[1] : after.slice(0, 60)).trim() || null;
}

function dnsWorkplace(html) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  // Explicit hybrid -- check before remote so "remote or hybrid" still passes as Remote
  if (/(?:work\s+(?:arrangement|type|model)|position\s+type)[:\s]+hybrid/i.test(text)) return "Hybrid";
  // Any credible remote signal in the posting body
  if (/fully\s+remote|100\s*%\s*remote|remote[- ]first|work\s+from\s+(home|anywhere|canada)|remote\s+position|this\s+(?:role|position|job)\s+is\s+remote|(?:work\s+(?:arrangement|type|model)|position\s+type)[:\s]+remote|remote\s+work\s+(available|supported|option|eligible)/i.test(text)) return "Remote";
  return "Nova Scotia, Canada";
}

export function fromDigitalNS(job) {
  const html    = job.content?.rendered ?? "";
  const title   = (job.title?.rendered ?? "").replace(/&[a-z#\d]+;/gi, " ").trim();
  const company = dnsCompany(html) ?? "DNS Member";
  const place   = dnsWorkplace(html);
  return {
    id:                 `dns-${job.id}`,
    title,
    company,
    location:           place,
    workplaceType:      place,
    salary:             null,
    currency:           null,
    postedAt:           job.date ? new Date(job.date).toISOString() : null,
    url:                job.link ?? "",
    source:             "Digital Nova Scotia",
    category:           "canadian",
    descriptionSnippet: toSnippet(html),
  };
}

// ── Himalayas ─────────────────────────────────────────────────────────────

function mapHimalayasSeniority(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const levels = arr.map(s => s.toLowerCase());
  if (levels.some(s => /junior|entry/.test(s))) return "0-2";
  if (levels.some(s => /mid/.test(s))) return "2-5";
  if (levels.some(s => /senior|lead|staff|principal|executive|head/.test(s))) return "5+";
  return null;
}

export function fromHimalayas(job) {
  const locs   = (job.locationRestrictions ?? []).join(", ") || "Canada Remote";
  const salary = job.minSalary && job.maxSalary
    ? `$${Math.round(job.minSalary / 1000)}k - $${Math.round(job.maxSalary / 1000)}k ${job.currency ?? "USD"}`
    : null;
  const slug   = (job.applicationLink ?? job.guid ?? "").split("/").filter(Boolean).pop() ?? "";
  return {
    id:                 `hm-${job.companySlug ?? "x"}-${slug}`,
    title:              job.title ?? "",
    company:            job.companyName ?? "",
    location:           locs,
    workplaceType:      "Remote",
    salary,
    currency:           job.currency ?? (salary ? "USD" : null),
    postedAt:           job.pubDate ? new Date(job.pubDate * 1000).toISOString() : null,
    url:                job.applicationLink ?? job.guid ?? "",
    source:             "Himalayas",
    category:           "remote",
    // country=CA in the API query guarantees Canada eligibility
    canadaOpen:         true,
    _canadaSource:      "source",
    // Himalayas declares seniority directly -- use it as a pre-Groq scoring signal
    sourceExp:          mapHimalayasSeniority(job.seniority),
    descriptionSnippet: toSnippet(job.description ?? job.excerpt ?? ""),
  };
}

// ── RemoteOK ──────────────────────────────────────────────────────────────────

export function fromRemoteOk(job) {
  const tags   = (job.tags ?? []).join(" ");
  const raw    = [job.description ?? "", tags].filter(Boolean).join(" ");
  const salary = job.salary_min
    ? `$${Math.round(job.salary_min / 1000)}k - $${Math.round(job.salary_max / 1000)}k USD`
    : null;
  const url    = job.url
    ? (job.url.startsWith("http") ? job.url : `https://remoteok.com${job.url}`)
    : "";
  const postedAt = job.date
    ? (typeof job.date === "number"
        ? new Date(job.date * 1000).toISOString()
        : job.date)
    : null;
  return {
    id:                 `rok-${job.id}`,
    title:              job.position ?? "",
    company:            job.company ?? "",
    location:           job.location || "Remote",
    workplaceType:      "Remote",
    salary,
    currency:           salary ? "USD" : null,
    postedAt,
    url,
    source:             "RemoteOK",
    category:           "remote",
    descriptionSnippet: toSnippet(raw),
  };
}
