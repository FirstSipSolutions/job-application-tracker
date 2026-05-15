import { fromGreenhouse } from "../normalize.js";

const COMPANIES = [
  // ── Global-remote first (known to hire Canadians) ─────────────────────────
  { name: "GitLab",        slug: "gitlab",       category: "global-remote" },
  { name: "Mattermost",    slug: "mattermost",   category: "global-remote" },
  { name: "Grafana Labs",  slug: "grafanalabs",  category: "global-remote" },
  { name: "Elastic",       slug: "elastic",      category: "global-remote" },
  { name: "MongoDB",       slug: "mongodb",      category: "global-remote" },
  { name: "Buildkite",     slug: "buildkite",    category: "global-remote" },
  { name: "PagerDuty",     slug: "pagerduty",    category: "global-remote" },
  { name: "Cloudflare",    slug: "cloudflare",   category: "global-remote" },
  { name: "HubSpot",       slug: "hubspot",      category: "global-remote" },
  { name: "Temporal",      slug: "temporal",     category: "global-remote" },
  { name: "Webflow",       slug: "webflow",      category: "global-remote" },
  { name: "Dropbox",       slug: "dropbox",      category: "global-remote" },
  { name: "Intercom",      slug: "intercom",     category: "global-remote" },
  { name: "Okta",          slug: "okta",         category: "global-remote" },
  { name: "Databricks",    slug: "databricks",   category: "global-remote" },
  { name: "Amplitude",     slug: "amplitude",    category: "global-remote" },
  { name: "Asana",         slug: "asana",        category: "global-remote" },
  { name: "Reddit",        slug: "reddit",       category: "global-remote" },
  { name: "Twilio",        slug: "twilio",       category: "global-remote" },
  { name: "Mixpanel",      slug: "mixpanel",     category: "global-remote" },
  { name: "Descript",      slug: "descript",     category: "global-remote" },
  { name: "Samsara",       slug: "samsara",      category: "global-remote" },
  // ── AI / dev-tools ────────────────────────────────────────────────────────
  { name: "Anthropic",     slug: "anthropic",    category: "devtools" },
  { name: "Scale AI",      slug: "scaleai",      category: "devtools" },
  // ── Global-remote startups ─────────────────────────────────────────────────
  { name: "Remote",        slug: "remote",       category: "global-remote" },
  // ── Fintech (many hire across North America) ──────────────────────────────
  { name: "Stripe",        slug: "stripe",       category: "fintech"  },
  { name: "Brex",          slug: "brex",         category: "fintech"  },
  { name: "Faire",         slug: "faire",        category: "fintech"  },
  { name: "Gusto",         slug: "gusto",        category: "fintech"  },
  { name: "Carta",         slug: "carta",        category: "fintech"  },
  { name: "Vercel",        slug: "vercel",       category: "devtools" },
  { name: "Figma",         slug: "figma",        category: "devtools" },
  // ── Canadian companies ────────────────────────────────────────────────────
  { name: "Tailscale",     slug: "tailscale",    category: "canadian" }, // networking/VPN, Toronto-distributed, confirmed GH
  { name: "Vidyard",       slug: "vidyard",      category: "canadian" }, // video platform, Waterloo, confirmed GH
  { name: "D2L",           slug: "d2l",          category: "canadian" },
  { name: "Benevity",      slug: "benevity",     category: "canadian" },
  { name: "Tulip",         slug: "tulip",        category: "canadian" },
  { name: "Ecobee",        slug: "ecobee",       category: "canadian" },
  { name: "Hootsuite",     slug: "hootsuite",    category: "canadian" },
  { name: "TouchBistro",   slug: "touchbistro",  category: "canadian" },
  { name: "StackAdapt",    slug: "stackadapt",   category: "canadian" },
  { name: "Later",         slug: "later",        category: "canadian" },
  { name: "Coconut Software", slug: "coconutsoftware", category: "canadian" },
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
