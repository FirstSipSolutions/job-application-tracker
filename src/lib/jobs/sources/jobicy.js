import { fromJobicy } from "../normalize.js";

// geo=canada scopes to Canadian postings - the isTech title filter drops the
// non-dev roles downstream, so I no longer pin industry=engineering here.
// Dropping that filter and raising count roughly doubled the Canada-eligible
// dev roles this source contributes. Jobicy is the one aggregator that reliably
// stays Canada-scoped, so it carries most of the multi-company variety.
const URL = "https://jobicy.com/api/v2/remote-jobs?count=100&geo=canada";
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
