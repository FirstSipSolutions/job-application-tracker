// Shared Groq classification core.
// Used by the production Cloudflare Pages Function (classify.js) and the Vite
// dev middleware (vite.config.js). The underscore prefix keeps Cloudflare
// Pages from exposing this file as a route.
//
// The prompt is built server-side so the endpoint can only be used to
// classify job postings - not as an open proxy to Groq.

const GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions";
// Groq deprecated llama-3.1-8b-instant (free-tier shutdown Aug 2026); this is
// their recommended free replacement. Swap here if it changes again.
const MODEL      = "openai/gpt-oss-20b";
const DESC_CHARS = 150;

export const MAX_JOBS = 8;

const STACK_OPTIONS = ["React","Vue","Angular","Python","Node","TypeScript","Go","Rust","Java","Mobile","DevOps","Data"];

function buildPrompt(jobs) {
  const lines = jobs.map((j, i) => {
    let line = `${i}. "${j.title}" at ${j.company} | ${j.location || "Remote"}`;
    if (j.snippet) line += ` | ${String(j.snippet).slice(0, DESC_CHARS)}`;
    return line;
  });

  return (
    `You are a job data extractor. For each job return one JSON object with five fields.\n\n` +
    `Fields:\n` +
    `  i: the job's number from the list below (echo it back exactly)\n` +
    `  c: 1 if open to Canadian remote workers, 0 if not\n` +
    `  s: primary tech stack - exactly one of: ${STACK_OPTIONS.join(", ")} - or null\n` +
    `  e: years of experience required - "0-2", "2-5", "5+", or null\n` +
    `  sal: 1 if a salary or compensation range is mentioned anywhere, 0 if not\n\n` +
    `Rules for c:\n` +
    `  - Canadian company or location mentions Canada = 1\n` +
    `  - Worldwide / Global / Anywhere / North America = 1\n` +
    `  - Known global-remote teams (GitLab, Vercel, Automattic, Zapier, Buffer, etc.) = 1\n` +
    `  - "Remote US", "US only", US city with no global mention = 0\n` +
    `  - US work authorization required = 0\n` +
    `  - EU only or UK only = 0\n` +
    `  - Uncertain = 1\n\n` +
    `Rules for s:\n` +
    `  - Use the job title first - "React Engineer" = React\n` +
    `  - Then scan description for the main framework/language\n` +
    `  - Frontend with no specific framework = React\n` +
    `  - Backend with no specific language = Node\n` +
    `  - k8s/AWS/GCP/infrastructure = DevOps\n` +
    `  - null only if truly impossible to determine\n\n` +
    `Rules for e:\n` +
    `  - Only use explicit year counts from the description\n` +
    `  - "1+ year", "0-2 years", "new grad", "entry level" = "0-2"\n` +
    `  - "2+ years", "3 years", "2-4 years" = "2-5"\n` +
    `  - "5+ years", "7 years", "8+ years" = "5+"\n` +
    `  - Title says Senior/Lead but no year count in description = null\n` +
    `  - Nothing mentioned = null\n\n` +
    `Rules for sal:\n` +
    `  - Any dollar amount, range, or OTE mentioned = 1\n` +
    `  - "competitive salary", "equity", "stock options" alone = 0\n` +
    `  - No compensation info = 0\n\n` +
    `Reply ONLY with a JSON array, one object per job, in the same order:\n` +
    `[{"i":0,"c":1,"s":"React","e":"2-5","sal":1}, ...]\n\n` +
    `Jobs:\n` + lines.join("\n")
  );
}

// Returns { status, results, usage }. results is null unless status === 200.
export async function classifyWithGroq(jobs, apiKey) {
  const trimmed = jobs.slice(0, MAX_JOBS);

  const res = await fetch(GROQ_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model:       MODEL,
      messages:    [{ role: "user", content: buildPrompt(trimmed) }],
      temperature: 0,
      // gpt-oss is a reasoning model: it spends tokens thinking before it writes
      // content. Keep reasoning minimal and leave enough room for both the
      // reasoning and the JSON, or content comes back empty (finish: length).
      reasoning_effort: "low",
      max_tokens:  trimmed.length * 90 + 500,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { status: res.status, results: null, usage: null, detail: detail.slice(0, 300) };
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";

  const arrMatch = text.match(/\[[\s\S]+\]/);
  const objMatch = text.match(/\{[\s\S]+\}/);
  if (!arrMatch && !objMatch) return { status: 502, results: null, usage: null };

  let raw;
  try { raw = JSON.parse(arrMatch ? arrMatch[0] : objMatch[0]); }
  catch { return { status: 502, results: null, usage: null }; }

  return {
    status:  200,
    results: Array.isArray(raw) ? raw : [raw],
    usage:   data.usage ?? null,
  };
}
