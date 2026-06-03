// Cloudflare Pages Function — proxies Workday CXS API to bypass browser CORS.
// Usage: /api/workday?tenant=nasdaq&board=Global_External_Site&wd=1&q=software+developer

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "s-maxage=300",
};

export async function onRequest(context) {
  const url    = new URL(context.request.url);
  const tenant = url.searchParams.get("tenant") ?? "";
  const board  = url.searchParams.get("board")  ?? "";
  const wd     = url.searchParams.get("wd")     ?? "3";
  const q      = url.searchParams.get("q")      ?? "software developer";

  if (!tenant || !board) {
    return new Response(JSON.stringify({ jobPostings: [] }), { headers: HEADERS });
  }

  const upstream = `https://${tenant}.wd${wd}.myworkdayjobs.com/wday/cxs/${tenant}/${board}/jobs`;
  try {
    const res = await fetch(upstream, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "CVVault/1.0" },
      body:    JSON.stringify({ limit: 100, offset: 0, searchText: q, appliedFacets: {} }),
    });
    if (!res.ok) return new Response(JSON.stringify({ jobPostings: [] }), { headers: HEADERS });
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: HEADERS });
  } catch {
    return new Response(JSON.stringify({ jobPostings: [] }), { headers: HEADERS });
  }
}
