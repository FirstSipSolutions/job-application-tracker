import { fromWorkable } from "../normalize.js";

// Proxied via /api/workable (CF function in prod, vite middleware in dev).
const COMPANIES = [
  // ── Canadian ──────────────────────────────────────────────────────────────────
  { name: "Hopper",     slug: "hopper",     category: "canadian" },
  { name: "Ritual",     slug: "ritual",     category: "canadian" },
  { name: "Float",      slug: "floatfinancial", category: "canadian" },
  { name: "ApplyBoard", slug: "applyboard", category: "canadian" },
  { name: "Wattpad",    slug: "wattpad",    category: "canadian" },
];

const TIMEOUT_MS = 10000;
const BASE       = "/api/workable";

async function fetchOne({ name, slug, category }) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}?slug=${encodeURIComponent(slug)}`, { signal: ctrl.signal });
    if (!res.ok) return [];
    const { results } = await res.json();
    return (results ?? []).map(j => fromWorkable(j, name, category));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchWorkable() {
  const results = await Promise.allSettled(COMPANIES.map(fetchOne));
  return results.flatMap(r => r.status === "fulfilled" ? r.value : []);
}
