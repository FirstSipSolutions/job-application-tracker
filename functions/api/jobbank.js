// Cloudflare Pages Function -- proxies Job Bank Canada Atom feed to bypass browser CORS.
// Deployed at: /api/jobbank?term=<search+term>
// Vite dev: proxied via vite.config.js

const BASE = "https://www.jobbank.gc.ca/jobsearch/feed/jobSearchRSSfeed";

const HEADERS = {
  "Content-Type": "application/xml;charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "s-maxage=300",
};

export async function onRequest(context) {
  const term = new URL(context.request.url).searchParams.get("term") || "software developer";
  const upstream = `${BASE}?term=${encodeURIComponent(term)}&rows=100`;
  try {
    const res = await fetch(upstream, {
      headers: { "User-Agent": "CVVault/1.0", "Accept": "application/atom+xml" },
    });
    if (!res.ok) return new Response("<feed/>", { headers: HEADERS });
    const xml = await res.text();
    return new Response(xml, { headers: HEADERS });
  } catch {
    return new Response("<feed/>", { headers: HEADERS });
  }
}
