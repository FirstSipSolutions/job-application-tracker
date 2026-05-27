import { fromTechNL } from "../normalize.js";

// Tech NL -- Newfoundland & Labrador tech industry job board.
// Uses the WP Job Manager REST API (same plugin as DNS but different post type slug).
// Meta fields give us company name and location directly — no HTML parsing needed.
// Proxied through /api/technl (Cloudflare Function in prod, Vite proxy in dev).

const BASE       = "/api/technl";
const TIMEOUT_MS = 8000;

async function fetchPage(page, signal) {
  const res = await fetch(`${BASE}?page=${page}`, { signal });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchTechNL() {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const page1 = await fetchPage(1, ctrl.signal);
    if (!page1.length) return [];
    // Fetch page 2 if the board ever grows beyond 100 listings
    const page2 = page1.length === 100 ? await fetchPage(2, ctrl.signal) : [];
    return [...page1, ...page2].map(fromTechNL);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
