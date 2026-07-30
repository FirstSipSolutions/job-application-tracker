// Cloudflare Pages Function - proxies Adzuna's Canada job search so the
// app_id / app_key stay server-side (env secrets), never in the client bundle.
// Usage: /api/adzuna?what=software+developer&page=1

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "s-maxage=300",
};

export async function onRequest(context) {
  const id  = context.env.ADZUNA_APP_ID;
  const key = context.env.ADZUNA_APP_KEY;
  if (!id || !key) return new Response(JSON.stringify({ results: [] }), { headers: HEADERS });

  const url  = new URL(context.request.url);
  const what = url.searchParams.get("what") ?? "software developer";
  const page = url.searchParams.get("page") ?? "1";
  const upstream = `https://api.adzuna.com/v1/api/jobs/ca/search/${page}` +
    `?app_id=${id}&app_key=${key}&results_per_page=50&what=${encodeURIComponent(what)}&content-type=application/json`;

  try {
    const res = await fetch(upstream);
    if (!res.ok) return new Response(JSON.stringify({ results: [] }), { headers: HEADERS });
    return new Response(await res.text(), { headers: HEADERS });
  } catch {
    return new Response(JSON.stringify({ results: [] }), { headers: HEADERS });
  }
}
