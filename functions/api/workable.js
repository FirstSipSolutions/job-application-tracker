// Cloudflare Pages Function — proxies Workable API to bypass browser CORS.
// Usage: /api/workable?slug=hopper

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "s-maxage=300",
};

export async function onRequest(context) {
  const url  = new URL(context.request.url);
  const slug = url.searchParams.get("slug") ?? "";

  if (!slug) return new Response(JSON.stringify({ results: [] }), { headers: HEADERS });

  const upstream = `https://apply.workable.com/api/v3/accounts/${slug}/jobs`;
  try {
    const res = await fetch(upstream, { headers: { "User-Agent": "CVVault/1.0" } });
    if (!res.ok) return new Response(JSON.stringify({ results: [] }), { headers: HEADERS });
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: HEADERS });
  } catch {
    return new Response(JSON.stringify({ results: [] }), { headers: HEADERS });
  }
}
