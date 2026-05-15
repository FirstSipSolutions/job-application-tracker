import { fromWeWorkRemotely } from "../normalize.js";

// Programming/dev category only — avoids design, support, and sales roles
const URL        = "https://weworkremotely.com/categories/remote-programming-jobs.rss";
const TIMEOUT_MS = 8000;

export async function fetchWeWorkRemotely() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(URL, { signal: controller.signal });
    if (!res.ok) return [];
    const xml = await res.text();
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    return [...doc.getElementsByTagName("item")].map(fromWeWorkRemotely);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
