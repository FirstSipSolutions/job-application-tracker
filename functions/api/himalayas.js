// Cloudflare Pages Function -- proxies Himalayas API to bypass browser CORS.
// Deployed at: /api/himalayas
// Vite dev: proxied via vite.config.js

const UPSTREAM = "https://himalayas.app/jobs/api/search?sort=recent&limit=100";

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "s-maxage=300",
};

export async function onRequest() {
  try {
    const res = await fetch(UPSTREAM, { headers: { "User-Agent": "CVVault/1.0" } });
    if (!res.ok) return new Response(JSON.stringify({ jobs: [] }), { headers: HEADERS });
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: HEADERS });
  } catch {
    return new Response(JSON.stringify({ jobs: [] }), { headers: HEADERS });
  }
}
