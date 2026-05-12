import { fromGreenhouse } from "../normalize.js";

// Verified live: boards-api.greenhouse.io/v1/boards/{slug}/jobs
// Mix of big tech, mid-size, and Canadian companies — $60k USD / $70k CAD+
const COMPANIES = [
  // US product companies
  { name: "Stripe",        slug: "stripe" },
  { name: "Vercel",        slug: "vercel" },
  { name: "Cloudflare",    slug: "cloudflare" },
  { name: "GitLab",        slug: "gitlab" },
  { name: "Figma",         slug: "figma" },
  { name: "Twilio",        slug: "twilio" },
  { name: "Amplitude",     slug: "amplitude" },
  { name: "PagerDuty",     slug: "pagerduty" },
  { name: "MongoDB",       slug: "mongodb" },
  { name: "Elastic",       slug: "elastic" },
  { name: "Databricks",    slug: "databricks" },
  { name: "Grafana Labs",  slug: "grafanalabs" },
  { name: "Okta",          slug: "okta" },
  { name: "Intercom",      slug: "intercom" },
  { name: "Brex",          slug: "brex" },
  { name: "Webflow",       slug: "webflow" },
  { name: "Dropbox",       slug: "dropbox" },
  { name: "Samsara",       slug: "samsara" },
  { name: "Faire",         slug: "faire" },
  { name: "Mixpanel",      slug: "mixpanel" },
  { name: "Gusto",         slug: "gusto" },
  { name: "Mattermost",    slug: "mattermost" },
  { name: "Descript",      slug: "descript" },
  { name: "Carta",         slug: "carta" },
  { name: "Reddit",        slug: "reddit" },
  { name: "Asana",         slug: "asana" },
  { name: "Buildkite",     slug: "buildkite" },
  { name: "HubSpot",       slug: "hubspot" },
  { name: "Temporal",      slug: "temporal" },
  // AI / dev-tool
  { name: "Anthropic",     slug: "anthropic" },
  // Canadian companies
  { name: "D2L",           slug: "d2l" },
  { name: "Benevity",      slug: "benevity" },
  { name: "Tulip",         slug: "tulip" },
  { name: "Ecobee",        slug: "ecobee" },
];

const TIMEOUT_MS = 8000;
const BASE       = "https://boards-api.greenhouse.io/v1/boards";

async function fetchOne({ name, slug }) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/${slug}/jobs`, { signal: ctrl.signal });
    if (!res.ok) return [];
    const { jobs } = await res.json();
    return (jobs ?? []).map(j => fromGreenhouse(j, name));
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
