// Cloudflare Pages Function - classifies job postings via Groq.
// The API key lives in the GROQ_API_KEY environment secret (Pages dashboard),
// never in the client bundle. POST { jobs: [{ title, company, location, snippet }] }
// → { results: [{ i, c, s, e, sal }], usage }.

import { classifyWithGroq, MAX_JOBS } from "./_groq.js";

const HEADERS = { "Content-Type": "application/json" };

function reply(status, body) {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

export async function onRequestPost(context) {
  const apiKey = context.env.GROQ_API_KEY;
  if (!apiKey) return reply(503, { error: "GROQ_API_KEY not configured" });

  let body;
  try { body = await context.request.json(); }
  catch { return reply(400, { error: "Invalid JSON" }); }

  const jobs = Array.isArray(body?.jobs) ? body.jobs : [];
  if (jobs.length === 0 || jobs.length > MAX_JOBS) {
    return reply(400, { error: `jobs must contain 1-${MAX_JOBS} items` });
  }

  try {
    const out = await classifyWithGroq(jobs, apiKey);
    if (out.status !== 200) return reply(out.status === 429 ? 429 : 502, { error: `Groq ${out.status}` });
    return reply(200, { results: out.results, usage: out.usage });
  } catch {
    return reply(502, { error: "Groq request failed" });
  }
}
