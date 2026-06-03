import { fromJobicy } from "../normalize.js";

// geo=canada scopes to Canadian postings.
// industry=engineering is the closest Jobicy category for tech roles.
// count=50 gives us enough pool to filter and shuffle from.
const URL = "https://jobicy.com/api/v2/remote-jobs?count=50&geo=canada&industry=engineering";
const TIMEOUT_MS = 6000;

export async function fetchJobicy() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res  = await fetch(URL, { signal: controller.signal });
    const { jobs } = await res.json();
    return (jobs ?? []).map(fromJobicy);
  } finally {
    clearTimeout(timer);
  }
}
