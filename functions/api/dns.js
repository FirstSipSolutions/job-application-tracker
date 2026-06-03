// Cloudflare Pages Function -- proxies Digital Nova Scotia WordPress API to bypass browser CORS.
// Deployed at: /api/dns?page=N
// Vite dev: proxied via vite.config.js

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "s-maxage=300",
};

export async function onRequest(context) {
  const page = new URL(context.request.url).searchParams.get("page") || "1";
  const upstream = `https://digitalnovascotia.com/wp-json/wp/v2/job_portal?per_page=100&status=publish&page=${page}`;
  try {
    const res = await fetch(upstream);
    if (!res.ok) return new Response("[]", { headers: HEADERS });
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: HEADERS });
  } catch {
    return new Response("[]", { headers: HEADERS });
  }
}
