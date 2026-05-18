import { fromGreenhouse } from "../normalize.js";

const COMPANIES = [
  // ── Global-remote (known to hire Canadians) ───────────────────────────────
  { name: "GitLab",        slug: "gitlab",        category: "global-remote" },
  { name: "Mattermost",    slug: "mattermost",    category: "global-remote" },
  { name: "Grafana Labs",  slug: "grafanalabs",   category: "global-remote" },
  { name: "Elastic",       slug: "elastic",       category: "global-remote" },
  { name: "MongoDB",       slug: "mongodb",       category: "global-remote" },
  { name: "Buildkite",     slug: "buildkite",     category: "global-remote" },
  { name: "PagerDuty",     slug: "pagerduty",     category: "global-remote" },
  { name: "Cloudflare",    slug: "cloudflare",    category: "global-remote" },
  { name: "HubSpot",       slug: "hubspot",       category: "global-remote" },
  { name: "Temporal",      slug: "temporal",      category: "global-remote" },
  { name: "Webflow",       slug: "webflow",       category: "global-remote" },
  { name: "Dropbox",       slug: "dropbox",       category: "global-remote" },
  { name: "Intercom",      slug: "intercom",      category: "global-remote" },
  { name: "Okta",          slug: "okta",          category: "global-remote" },
  { name: "Databricks",    slug: "databricks",    category: "global-remote" },
  { name: "Amplitude",     slug: "amplitude",     category: "global-remote" },
  { name: "Asana",         slug: "asana",         category: "global-remote" },
  { name: "Reddit",        slug: "reddit",        category: "global-remote" },
  { name: "Twilio",        slug: "twilio",        category: "global-remote" },
  { name: "Mixpanel",      slug: "mixpanel",      category: "global-remote" },
  { name: "Descript",      slug: "descript",      category: "global-remote" },
  { name: "Samsara",       slug: "samsara",       category: "global-remote" },
  { name: "Netlify",       slug: "netlify",       category: "global-remote" },
  { name: "Postman",       slug: "postman",       category: "global-remote" },
  { name: "LaunchDarkly",  slug: "launchdarkly",  category: "global-remote" },
  { name: "Algolia",       slug: "algolia",       category: "global-remote" },
  { name: "Braze",         slug: "braze",         category: "global-remote" },
  { name: "Fastly",        slug: "fastly",        category: "global-remote" },
  { name: "New Relic",     slug: "newrelic",      category: "global-remote" },
  { name: "CockroachLabs", slug: "cockroachlabs", category: "global-remote" },
  { name: "Calendly",      slug: "calendly",      category: "global-remote" },
  { name: "Pendo",         slug: "pendo",         category: "global-remote" },
  { name: "Contentful",    slug: "contentful",    category: "global-remote" },
  { name: "Duolingo",      slug: "duolingo",      category: "global-remote" },
  { name: "Datadog",       slug: "datadog",       category: "global-remote" },
  { name: "Discord",       slug: "discord",       category: "global-remote" },
  { name: "Squarespace",   slug: "squarespace",   category: "global-remote" },
  { name: "Lob",           slug: "lob",           category: "global-remote" },
  { name: "Yext",          slug: "yext",          category: "global-remote" },
  { name: "Ripple",        slug: "ripple",        category: "global-remote" },
  // ── AI / dev-tools ────────────────────────────────────────────────────────
  { name: "Anthropic",     slug: "anthropic",     category: "devtools" },
  { name: "Scale AI",      slug: "scaleai",       category: "devtools" },
  { name: "Figma",         slug: "figma",         category: "devtools" },
  { name: "Vercel",        slug: "vercel",        category: "devtools" },
  // ── Fintech ───────────────────────────────────────────────────────────────
  { name: "Stripe",        slug: "stripe",        category: "fintech" },
  { name: "Brex",          slug: "brex",          category: "fintech" },
  { name: "Faire",         slug: "faire",         category: "fintech" },
  { name: "Gusto",         slug: "gusto",         category: "fintech" },
  { name: "Carta",         slug: "carta",         category: "fintech" },
  { name: "Affirm",        slug: "affirm",        category: "fintech" },
  // ── Canadian ──────────────────────────────────────────────────────────────
  { name: "Shopify",       slug: "shopify",       category: "canadian" },
  { name: "Jobber",        slug: "jobber",        category: "canadian" },
  { name: "Tailscale",     slug: "tailscale",     category: "canadian" },
  { name: "D2L",           slug: "d2l",           category: "canadian" },
  { name: "Benevity",      slug: "benevity",      category: "canadian" },
  { name: "Tulip",         slug: "tulip",         category: "canadian" },
  { name: "Ecobee",        slug: "ecobee",        category: "canadian" },
  { name: "Hootsuite",     slug: "hootsuite",     category: "canadian" },
  { name: "TouchBistro",   slug: "touchbistro",   category: "canadian" },
  { name: "StackAdapt",    slug: "stackadapt",    category: "canadian" },
  { name: "Later",         slug: "later",         category: "canadian" },
  { name: "Coconut Software", slug: "coconutsoftware", category: "canadian" },
  { name: "AlayaCare",     slug: "alayacare",     category: "canadian" },
];

const TIMEOUT_MS = 8000;
const BASE       = "https://boards-api.greenhouse.io/v1/boards";

async function fetchOne({ name, slug, category }) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/${slug}/jobs?content=true`, { signal: ctrl.signal });
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
