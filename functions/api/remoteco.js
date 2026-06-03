// Cloudflare Pages Function — proxies Remote.co developer RSS to bypass browser CORS.
// Deployed at: /api/remoteco

const UPSTREAM = "https://remote.co/remote-jobs/developer/feed/";

const HEADERS = {
  "Content-Type": "application/rss+xml",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "s-maxage=300",
};

export async function onRequest() {
  try {
    const res = await fetch(UPSTREAM, { headers: { "User-Agent": "CVVault/1.0" } });
    if (!res.ok) return new Response("<rss/>", { headers: HEADERS });
    const text = await res.text();
    return new Response(text, { headers: HEADERS });
  } catch {
    return new Response("<rss/>", { headers: HEADERS });
  }
}
