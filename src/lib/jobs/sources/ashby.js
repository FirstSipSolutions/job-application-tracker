import { fromAshby } from "../normalize.js";

// Verified live: api.ashbyhq.com/posting-api/job-board/{slug}
const COMPANIES = [
  // Product companies
  { name: "Linear",    slug: "linear" },
  { name: "Notion",    slug: "notion" },
  { name: "Replit",    slug: "replit" },
  { name: "Deel",      slug: "deel" },
  { name: "Supabase",  slug: "supabase" },
  { name: "Vanta",     slug: "vanta" },
  { name: "Ramp",      slug: "ramp" },
  { name: "Zapier",    slug: "zapier" },
  { name: "PostHog",   slug: "posthog" },
  { name: "Loom",      slug: "loom" },
  { name: "Mercury",   slug: "mercury" },
  { name: "Railway",   slug: "railway" },
  { name: "Resend",    slug: "resend" },
  { name: "Warp",      slug: "warp" },
  { name: "Raycast",   slug: "raycast" },
  { name: "Neon",      slug: "neon" },
  // AI / Canadian
  { name: "Cohere",    slug: "cohere" },
  { name: "Mistral",   slug: "mistral" },
];

const TIMEOUT_MS = 8000;
const BASE       = "https://api.ashbyhq.com/posting-api/job-board";

async function fetchOne({ name, slug }) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/${slug}`, { signal: ctrl.signal });
    if (!res.ok) return [];
    const { jobs } = await res.json();
    return (jobs ?? []).map(j => fromAshby(j, name));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAshby() {
  const results = await Promise.allSettled(COMPANIES.map(fetchOne));
  return results.flatMap(r => r.status === "fulfilled" ? r.value : []);
}
