import { fromAshby } from "../normalize.js";

const COMPANIES = [
  // Fullstack web / SaaS
  { name: "Linear",        slug: "linear",       category: "devtools" },
  { name: "Notion",        slug: "notion",       category: "devtools" },
  { name: "Replit",        slug: "replit",       category: "devtools" },
  { name: "Supabase",      slug: "supabase",     category: "devtools" },
  { name: "PostHog",       slug: "posthog",      category: "devtools" },
  { name: "Loom",          slug: "loom",         category: "devtools" },
  { name: "Railway",       slug: "railway",      category: "devtools" },
  { name: "Resend",        slug: "resend",       category: "devtools" },
  { name: "Warp",          slug: "warp",         category: "devtools" },
  { name: "Raycast",       slug: "raycast",      category: "devtools" },
  { name: "Neon",          slug: "neon",         category: "devtools" },
  { name: "Zapier",        slug: "zapier",       category: "devtools" },
  // Fintech
  { name: "Deel",          slug: "deel",         category: "fintech"  },
  { name: "Ramp",          slug: "ramp",         category: "fintech"  },
  { name: "Mercury",       slug: "mercury",      category: "fintech"  },
  // Security
  { name: "Vanta",         slug: "vanta",        category: "security" },
  // AI-product (build web apps, hire fullstack)
  { name: "Cursor",        slug: "anysphere",    category: "devtools" },
  { name: "Perplexity",    slug: "perplexityai", category: "devtools" },
  { name: "Cohere",        slug: "cohere",       category: "canadian" },
  { name: "Mistral",       slug: "mistral",      category: "devtools" },
  // More devtools / web infra
  { name: "Render",        slug: "render",       category: "devtools" },
  { name: "Fly.io",        slug: "fly",          category: "devtools" },
  { name: "Turso",         slug: "turso",        category: "devtools" },
  { name: "Clerk",         slug: "clerk",        category: "devtools" },
  { name: "Doppler",       slug: "doppler",      category: "security" },
  { name: "Infisical",     slug: "infisical",    category: "security" },
  { name: "Tailscale",     slug: "tailscale",    category: "security" },
  { name: "Sentry",        slug: "sentry",       category: "devtools" },
  { name: "Retool",        slug: "retool",       category: "devtools" },
  { name: "Deno",          slug: "deno",         category: "devtools" },
  { name: "Netlify",       slug: "netlify",      category: "devtools" },
  { name: "Codeium",       slug: "codeium",      category: "devtools" },
  { name: "Stytch",        slug: "stytch",       category: "security" },
  { name: "Expo",          slug: "expo",         category: "devtools" },
  { name: "Liveblocks",    slug: "liveblocks",   category: "devtools" },
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
