// Cloudflare Pages Function - proxies Workday CXS API to bypass browser CORS.
// Search: /api/workday?tenant=nasdaq&board=Global_External_Site&wd=1&q=software+developer
// Detail: /api/workday?tenant=...&board=...&wd=...&path=/job/...  (returns description)

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
  const path   = url.searchParams.get("path")   ?? "";

  if (!tenant || !board) {
    return new Response(JSON.stringify({ jobPostings: [] }), { headers: HEADERS });
  }

  const base = `https://${tenant}.wd${wd}.myworkdayjobs.com/wday/cxs/${tenant}/${board}`;
  try {
    const res = path.startsWith("/job/")
      ? await fetch(`${base}${path}`, { headers: { "User-Agent": "CVVault/1.0" } })
      : await fetch(`${base}/jobs`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", "User-Agent": "CVVault/1.0" },
          // Workday CXS rejects limit > 20 with HTTP 400
          body:    JSON.stringify({ limit: 20, offset: 0, searchText: q, appliedFacets: {} }),
        });
    if (!res.ok) return new Response(JSON.stringify({ jobPostings: [] }), { headers: HEADERS });
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: HEADERS });
  } catch {
    return new Response(JSON.stringify({ jobPostings: [] }), { headers: HEADERS });
  }
}
