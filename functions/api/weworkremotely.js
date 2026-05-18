// Cloudflare Pages Function — proxies We Work Remotely RSS to bypass browser CORS.
// Deployed at: /api/weworkremotely

const UPSTREAM = "https://weworkremotely.com/categories/remote-programming-jobs.rss";

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
