// Cloudflare Pages Function -- proxies Tech NL WordPress job-listings API to bypass CORS.
// Deployed at: /api/technl?page=N
// Vite dev: proxied via vite.config.js

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "s-maxage=300",
};

export async function onRequest(context) {
  const page = new URL(context.request.url).searchParams.get("page") || "1";
  const upstream = `https://technl.ca/wp-json/wp/v2/job-listings?per_page=100&status=publish&page=${page}&_fields=id,title,link,date,meta,content`;
  try {
    const res = await fetch(upstream, { headers: { "User-Agent": "CVVault/1.0" } });
    if (!res.ok) return new Response("[]", { headers: HEADERS });
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: HEADERS });
  } catch {
    return new Response("[]", { headers: HEADERS });
  }
}
