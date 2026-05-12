import { fromGreenhouse } from "../normalize.js";

const COMPANIES = [
  // US product companies
  { name: "Stripe",        slug: "stripe",       category: "fintech"  },
  { name: "Vercel",        slug: "vercel",       category: "devtools" },
  { name: "Cloudflare",    slug: "cloudflare",   category: "security" },
  { name: "GitLab",        slug: "gitlab",       category: "devtools" },
  { name: "Figma",         slug: "figma",        category: "devtools" },
  { name: "Twilio",        slug: "twilio",       category: "devtools" },
  { name: "Amplitude",     slug: "amplitude",    category: "devtools" },
  { name: "PagerDuty",     slug: "pagerduty",    category: "devtools" },
  { name: "MongoDB",       slug: "mongodb",      category: "devtools" },
  { name: "Elastic",       slug: "elastic",      category: "devtools" },
  { name: "Databricks",    slug: "databricks",   category: "devtools" },
  { name: "Grafana Labs",  slug: "grafanalabs",  category: "devtools" },
  { name: "Okta",          slug: "okta",         category: "security" },
  { name: "Intercom",      slug: "intercom",     category: "devtools" },
  { name: "Brex",          slug: "brex",         category: "fintech"  },
  { name: "Webflow",       slug: "webflow",      category: "devtools" },
  { name: "Dropbox",       slug: "dropbox",      category: "devtools" },
  { name: "Samsara",       slug: "samsara",      category: "devtools" },
  { name: "Faire",         slug: "faire",        category: "fintech"  },
  { name: "Mixpanel",      slug: "mixpanel",     category: "devtools" },
  { name: "Gusto",         slug: "gusto",        category: "fintech"  },
  { name: "Mattermost",    slug: "mattermost",   category: "devtools" },
  { name: "Descript",      slug: "descript",     category: "devtools" },
  { name: "Carta",         slug: "carta",        category: "fintech"  },
  { name: "Reddit",        slug: "reddit",       category: "devtools" },
  { name: "Asana",         slug: "asana",        category: "devtools" },
  { name: "Buildkite",     slug: "buildkite",    category: "devtools" },
  { name: "HubSpot",       slug: "hubspot",      category: "devtools" },
  { name: "Temporal",      slug: "temporal",     category: "devtools" },
  // AI / dev-tool
  { name: "Anthropic",     slug: "anthropic",    category: "devtools" },
  // Canadian companies
  { name: "D2L",           slug: "d2l",          category: "canadian" },
  { name: "Benevity",      slug: "benevity",     category: "canadian" },
  { name: "Tulip",         slug: "tulip",        category: "canadian" },
  { name: "Ecobee",        slug: "ecobee",       category: "canadian" },
  { name: "Clio",          slug: "clio",         category: "canadian" },
  { name: "1Password",     slug: "1password",    category: "canadian" },
  { name: "FreshBooks",    slug: "freshbooks",   category: "canadian" },
  { name: "Wealthsimple",  slug: "wealthsimple", category: "canadian" },
  { name: "Wave",          slug: "waveapps",     category: "canadian" },
];

const TIMEOUT_MS = 8000;
const BASE       = "https://boards-api.greenhouse.io/v1/boards";

async function fetchOne({ name, slug, category }) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/${slug}/jobs`, { signal: ctrl.signal });
    if (!res.ok) return [];
    const { jobs } = await res.json();
    return (jobs ?? []).map(j => fromGreenhouse(j, name, category));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchGreenhouse() {
  const results = await Promise.allSettled(COMPANIES.map(fetchOne));
  return results.flatMap(r => r.status === "fulfilled" ? r.value : []);
}
