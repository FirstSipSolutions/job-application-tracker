import { fromSiliconHarbour } from "../normalize.js";

// workplaceType=remote filters at the API — the board has ~120 remote jobs
const URL = "https://siliconharbour.dev/api/jobs?limit=150&workplaceType=remote";
const TIMEOUT_MS = 6000;

export async function fetchSiliconHarbour() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res  = await fetch(URL, { signal: controller.signal });
    if (!res.ok) return [];
    const { data } = await res.json();
    return (data ?? []).map(fromSiliconHarbour);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
