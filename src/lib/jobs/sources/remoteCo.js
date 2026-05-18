import { fromRemoteCo } from "../normalize.js";

// Proxied via /api/remoteco (CF function in prod, vite proxy in dev).
// Developer category feed — already filtered to programming roles.
const BASE       = "/api/remoteco";
const TIMEOUT_MS = 8000;

export async function fetchRemoteCo() {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res  = await fetch(BASE, { signal: ctrl.signal });
    if (!res.ok) return [];
    const text = await res.text();
    const doc  = new DOMParser().parseFromString(text, "text/xml");
    return [...doc.querySelectorAll("item")].map(fromRemoteCo);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
