import { fromRemoteOk } from "../normalize.js";

// Public API, no key required. First element is attribution metadata, skipped via filter.
const URL        = "https://remoteok.com/api";
const TIMEOUT_MS = 8000;

export async function fetchRemoteOk() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res  = await fetch(URL, { signal: controller.signal });
    const data = await res.json();
    return data.filter(j => j.id).map(fromRemoteOk);
  } finally {
    clearTimeout(timer);
  }
}
