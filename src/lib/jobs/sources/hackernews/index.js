/*
 * Hacker News "Who is Hiring?" source.
 *
 * On the first of every month a bot account (whoishiring) posts one big
 * "Ask HN: Who is hiring?" thread, and companies reply with a comment for each
 * open role. It is one of the few free places where small and mid-size
 * companies advertise remote developer jobs directly, so it brings variety the
 * fixed Greenhouse/Ashby boards never will.
 *
 * How it works:
 *   1. Ask the public HN Algolia search for the newest thread posted by the
 *      whoishiring bot.
 *   2. Pick the "Who is hiring?" thread (not the "who wants to be hired" or
 *      freelancer threads the same bot also posts).
 *   3. Fetch that thread with all of its comments in one request.
 *   4. Parse each comment into a job and keep the ones that parsed cleanly.
 *
 * No API key is needed. Because each job carries the real comment timestamp,
 * the shared freshness filter naturally keeps only recently posted roles -
 * which means this source is busiest in the first couple weeks of each month.
 */
import { parseHiringPost } from "./parseHiringPost.js";

// Newest-first list of the whoishiring bot's threads.
const SEARCH_URL  = "https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&hitsPerPage=10";
// One call returns the whole thread with its comments nested under `children`.
const THREAD_URL  = id => `https://hn.algolia.com/api/v1/items/${id}`;
const TIMEOUT_MS  = 10000;

export async function fetchHackerNews() {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const searchRes = await fetch(SEARCH_URL, { signal: ctrl.signal });
    if (!searchRes.ok) return [];
    const { hits } = await searchRes.json();

    // The bot posts three threads a month; only the hiring one is useful here.
    const thread = (hits ?? []).find(h => /who is hiring\?/i.test(h.title));
    if (!thread) return [];

    const threadRes = await fetch(THREAD_URL(thread.objectID), { signal: ctrl.signal });
    if (!threadRes.ok) return [];
    const item = await threadRes.json();

    return (item.children ?? [])
      .map(parseHiringPost)
      .filter(Boolean);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
