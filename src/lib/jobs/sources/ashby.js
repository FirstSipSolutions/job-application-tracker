import { fromAshby } from "../normalize.js";

const COMPANIES = [
  // ── Global-remote / known Canada-friendly ────────────────────────────────
  { name: "Zapier",      slug: "zapier",     category: "global-remote" },
  { name: "PostHog",     slug: "posthog",    category: "global-remote" },
  { name: "Supabase",    slug: "supabase",   category: "global-remote" },
  { name: "Sentry",      slug: "sentry",     category: "global-remote" },
  { name: "Help Scout",  slug: "helpscout",  category: "global-remote" },
  { name: "Deel",        slug: "deel",       category: "global-remote" },
  { name: "Loom",        slug: "loom",       category: "global-remote" },
  { name: "Sanity",      slug: "sanity",     category: "global-remote" },
  { name: "Ditto",       slug: "ditto",      category: "global-remote" },
  { name: "Causal",      slug: "causal",     category: "global-remote" },
  // ── Dev tools ─────────────────────────────────────────────────────────────
  { name: "Linear",      slug: "linear",     category: "devtools" },
  { name: "Notion",      slug: "notion",     category: "devtools" },
  { name: "Replit",      slug: "replit",     category: "devtools" },
  { name: "Railway",     slug: "railway",    category: "devtools" },
  { name: "Resend",      slug: "resend",     category: "devtools" },
  { name: "Warp",        slug: "warp",       category: "devtools" },
  { name: "Raycast",     slug: "raycast",    category: "devtools" },
  { name: "Neon",        slug: "neon",       category: "devtools" },
  { name: "Render",      slug: "render",     category: "devtools" },
  { name: "Clerk",       slug: "clerk",      category: "devtools" },
  // ── Security ──────────────────────────────────────────────────────────────
  { name: "Vanta",       slug: "vanta",      category: "security" },
  { name: "Doppler",     slug: "doppler",    category: "security" },
  { name: "Infisical",   slug: "infisical",  category: "security" },
  { name: "Stytch",      slug: "stytch",     category: "security" },
  // ── Fintech ───────────────────────────────────────────────────────────────
  { name: "Ramp",        slug: "ramp",       category: "fintech" },
  { name: "Mercury",     slug: "mercury",    category: "fintech" },
  // ── Canadian ──────────────────────────────────────────────────────────────
  { name: "Cohere",      slug: "cohere",     category: "canadian" },
  { name: "Clearco",     slug: "clearco",    category: "canadian" },
  { name: "Trulioo",     slug: "trulioo",    category: "canadian" },
  { name: "Relay",       slug: "relay",      category: "canadian" },
  { name: "Miovision",   slug: "miovision",  category: "canadian" },
  { name: "1Password",   slug: "1password",  category: "canadian" },
  { name: "Procurify",   slug: "procurify",  category: "canadian" },
  { name: "Klue",        slug: "klue",       category: "canadian" },
  { name: "Loopio",      slug: "loopio",     category: "canadian" },
];

const TIMEOUT_MS = 8000;
const BASE       = "https://api.ashbyhq.com/posting-api/job-board";

async function fetchOne({ name, slug, category }) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/${slug}`, { signal: ctrl.signal });
    if (!res.ok) return [];
    const { jobs } = await res.json();
    return (jobs ?? []).map(j => fromAshby(j, name, category));
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
