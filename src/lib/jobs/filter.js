// Shared filter applied to every job regardless of source.
// All conditions must pass or the job is dropped.

// ── isTech: two-layer title filter ────────────────────────────────────────────
//
// Layer 1 - NON_DEV: titles that are definitely not dev/engineering roles.
//   Checked first. If any pattern matches, the job is dropped immediately.
//   This catches "Product Manager", "UX Designer", etc. that sneak through
//   because they have tech-adjacent words in them.
//
// Layer 2 - DEV_ROLE: patterns that specifically identify the roles we want.
//   A title must match at least one of these to pass.
//   Much more precise than the old keyword-set approach. "designer" alone
//   used to pass because "design" was in TECH_KEYWORDS.
//
// Groq (lib/llm/classifyJobs.js) runs after this and catches anything
// the regex misses. These two layers work together, not in isolation.
// ─────────────────────────────────────────────────────────────────────────────

const NON_DEV = [
  /\bproduct\s+(manager|designer|owner)\b/i,
  /\b(ux|ui|graphic|visual|brand|motion)\s+designer\b/i,
  /\bdesigner\b/i,                          // lone "Designer" title
  /\bdata\s+(analyst|scientist)\b/i,
  /\b(business|systems|financial)\s+analyst\b/i,
  /\b(technical|sales|talent)\s+(recruiter|sourcer)\b/i,
  /\brecruiter\b/i,
  /\bscrum\s+master\b/i,
  /\bproject\s+manager\b/i,
  /\bprogram\s+manager\b/i,
  /\bmarketing\b/i,
  /\bcopywriter\b/i,
  /\bcontent\s+(strategist|writer|manager|creator)\b/i,
  /\bsocial\s+media\b/i,
  /\bsales\s+(manager|representative|executive|director)\b/i,
  /\boperations\s+manager\b/i,
  /\bfinance\s+manager\b/i,
  /\baccountant\b/i,
  /\blegal\s+counsel\b/i,
  /\bhuman\s+resources\b/i,
  // Management / non-IC
  /\bengineering\s+manager\b/i,
  /\btechnical\s+writer\b/i,
  /\bdeveloper\s+(relations|advocate|evangelist)\b/i,
  /\bcustomer\s+success\b/i,
  /\baccount\s+(executive|manager)\b/i,
  // Non-software engineering disciplines
  /\bcontrol\s+(?:&|and)\s+automation\b/i,
  /\belectrical\s+engineer\b/i,
  /\bmechanical\s+engineer\b/i,
  /\bcivil\s+engineer\b/i,
  /\bchemical\s+engineer\b/i,
  /\bindustrial\s+engineer\b/i,
  /\bprocess\s+engineer\b/i,
  /\bmanufacturing\s+engineer\b/i,
  /\bstructural\s+engineer\b/i,
  /\benvironmental\s+engineer\b/i,
  /\bfield\s+engineer\b/i,
  /\bin\s+training\b/i,
];

const DEV_ROLE = [
  // Core engineer / developer titles
  /\b(software|web|application|app)\s+(engineer|developer)\b/i,
  // Specialisations
  /\bfull[- ]?stack\b/i,
  /\bfront[- ]?end\s*(engineer|developer|dev)?\b/i,
  /\bback[- ]?end\s*(engineer|developer|dev)?\b/i,
  // Framework / language (must pair with engineer or developer to avoid
  // matching company names like "React Ventures" or "Python Capital")
  /\b(react|vue|angular|next\.?js|nuxt|svelte)\s+(engineer|developer)\b/i,
  /\b(node(\.js)?|express|django|rails|laravel|spring|fastapi)\s+(engineer|developer)\b/i,
  /\b(python|typescript|javascript|golang|go|rust|java|kotlin|swift|php|ruby|elixir|scala)\s+(engineer|developer)\b/i,
  // QA / Testing - "automation" alone is too broad (matches industrial/control automation)
  /\b(qa|quality\s+assurance)\s+engineer\b/i,
  /\btest\s+(automation\s+)?engineer\b/i,
  /\bqa\s+automation\b/i,
  /\bsdet\b/i,
  // DevOps / Infra
  /\bdevops\s+engineer\b/i,
  /\bsite\s+reliability\b/i,
  /\bsre\b/i,
  /\bplatform\s+engineer\b/i,
  /\bcloud\s+engineer\b/i,
  /\binfrastructure\s+engineer\b/i,
  // Architect
  /\b(software|solutions|technical|cloud|enterprise)\s+architect\b/i,
  // Mobile
  /\b(ios|android|mobile)\s+(engineer|developer)\b/i,
  /\breact\s+native\s+(engineer|developer)\b/i,
  /\bflutter\s+(engineer|developer)\b/i,
  // Seniority prefixes - safe to allow without a specialisation qualifier
  /\b(staff|principal|distinguished)\s+(engineer|developer|software)\b/i,
  // Adjacent engineering roles
  /\b(embedded|firmware)\s+engineer\b/i,
  /\bsecurity\s+engineer\b/i,
  /\bapplication\s+security\b/i,
  /\bdata\s+engineer\b/i,
  /\b(ml|machine\s+learning|ai)\s+engineer\b/i,
  // Startup / modern titles
  /\bfounding\s+(engineer|developer)\b/i,
  /\bproduct\s+engineer\b/i,
  /\btech(nical)?\s+lead\b/i,
  /\bgrowth\s+engineer\b/i,
  /\bintegration\s+(engineer|developer)\b/i,
  // Implementation / solutions roles that are hands-on technical
  /\bsolutions\s+engineer\b/i,
  /\bsoftware\s+systems\s+engineer\b/i,
  // Blockchain / web3
  /\b(blockchain|web3|smart\s+contract|solidity)\s+(engineer|developer)\b/i,
  // Broader "engineer" when paired with a tech domain word
  /\b(api|backend|distributed\s+systems|identity|iam)\s+engineer\b/i,
];

// Drop jobs older than this. Cuts ghost jobs and filled roles.
const MAX_AGE_DAYS = 20;

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
  return /remote|anywhere|worldwide/i.test(combined);
}

export function isTech(job) {
  const title = job.title ?? "";
  if (NON_DEV.some(re => re.test(title)))  return false;
  return DEV_ROLE.some(re => re.test(title));
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

// Pre-Groq Canada check - used as fallback before AI scoring runs.
// Stricter than before: blocks obvious US-scoped remote patterns, not just
// explicit "US only" language. Groq overrides this once it finishes.
export function isCanadaEligible(job) {
  const loc = `${job.location ?? ""} ${job.workplaceType ?? ""}`.toLowerCase();

  // Explicit exclusions
  if (/\bus\s*[-/]?\s*only\b|united states only|usa only/i.test(loc)) return false;
  if (/us\s+citizen|us\s+work\s+authorization|authorized.*work.*us/i.test(loc)) return false;
  if (/\beu\s*[-/]?\s*only\b|europe\s+only|\buk\s*[-/]?\s*only\b/i.test(loc)) return false;

  // "Remote (US)", "Remote - US", "Remote, US", "US Remote", "Remote United States"
  if (/\bremote\s*[,(\-]\s*(us|usa|united states)\b/i.test(loc)) return false;
  if (/\b(us|usa|united states)\s*[),\-]?\s*remote\b/i.test(loc)) return false;

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

// Broader tag set for display - catches specific tools TECH_STACKS lumps together.
const TAG_PATTERNS = [
  ["React",       /\breact\b(?!\s+native)/i],
  ["Next.js",     /\bnext\.?js\b/i],
  ["Vue",         /\bvue\b|\bnuxt\b/i],
  ["Angular",     /\bangular\b/i],
  ["TypeScript",  /\btypescript\b/i],
  ["JavaScript",  /\bjavascript\b|\bjs\b/i],
  ["Node",        /\bnode(\.js)?\b|\bexpress\b|\bnest\.?js\b/i],
  ["Python",      /\bpython\b|\bdjango\b|\bfastapi\b|\bflask\b/i],
  ["Go",          /\bgolang\b|\bgo\b/i],
  ["Rust",        /\brust\b/i],
  ["Java",        /\bjava\b(?!script)/i],
  ["Kotlin",      /\bkotlin\b/i],
  ["Swift",       /\bswift\b/i],
  ["React Native",/\breact\s+native\b/i],
  ["Flutter",     /\bflutter\b/i],
  ["AWS",         /\baws\b|\bamazon\s+web\s+services\b/i],
  ["GCP",         /\bgcp\b|\bgoogle\s+cloud\b/i],
  ["Azure",       /\bazure\b/i],
  ["Docker",      /\bdocker\b/i],
  ["Kubernetes",  /\bkubernetes\b|\bk8s\b/i],
  ["GraphQL",     /\bgraphql\b/i],
  ["PostgreSQL",  /\bpostgres(ql)?\b/i],
  ["MongoDB",     /\bmongo(db)?\b/i],
  ["Redis",       /\bredis\b/i],
];

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

  const m = snippet.match(/(\d+)\+?\s*(?:[-–to]+\s*(\d+)\s*)?years?\s*(?:of\s+)?(?:experience|exp\b)/i);
  if (m) {
    const min = parseInt(m[1], 10);
    if (min <= 2) return "0-2";
    if (min <= 5) return "2-5";
    return "5+";
  }

  if (/new\s*grad|entry[- ]level|0\s*[-–]\s*[12]\s*year|no\s+experience\s+required/i.test(snippet + " " + title)) return "0-2";

  // Do NOT infer "5+" from title words like Senior/Lead/Staff.
  // A job titled "Senior Engineer" with no stated years is unknown - let it show everywhere.
  return null;
}

export const EXPERIENCE_OPTIONS = [
  { value: "0-2", label: "0-2 yrs (Entry)" },
  { value: "2-5", label: "2-5 yrs (Mid)" },
  { value: "5+",  label: "5+ yrs (Senior)" },
];
