import { fromSiliconHarbour } from "../normalize.js";

const URL = "https://siliconharbour.dev/api/jobs?limit=100";
const TIMEOUT_MS = 6000;

export async function fetchSiliconHarbour() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res  = await fetch(URL, { signal: controller.signal });
    const { data } = await res.json();
    return (data ?? []).map(fromSiliconHarbour);
  } finally {
    clearTimeout(timer);
  }
}
