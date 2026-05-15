import { fromDigitalNS } from "../normalize.js";

// Digital Nova Scotia -- WordPress REST API proxied through /api/dns
// (Cloudflare Function in prod, Vite proxy in dev) to bypass browser CORS.
const BASE       = "/api/dns";
const TIMEOUT_MS = 8000;

async function fetchPage(page, signal) {
  const res = await fetch(`${BASE}?per_page=100&status=publish&page=${page}`, { signal });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchDigitalNS() {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const page1 = await fetchPage(1, ctrl.signal);
    if (!Array.isArray(page1)) return [];
    // If first page is full there may be more
    const page2 = page1.length === 100 ? await fetchPage(2, ctrl.signal) : [];
    return [...page1, ...(Array.isArray(page2) ? page2 : [])].map(fromDigitalNS);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
