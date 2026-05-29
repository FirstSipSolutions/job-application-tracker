// ── Groq Job Classifier ──────────────────────────────────────────────────────
//
// Classifies jobs in chunks of 6. Results cached in localStorage by URL so
// return visits cost 0 tokens for already-seen jobs.
//
// Each job gets four fields:
//   canadaOpen — true if open to Canadian remote workers
//   groqStack  — primary tech stack (React, Node, Python, etc.)
//   groqExp    — experience required ("0-2" | "2-5" | "5+" | null)
//   groqSal    — true if a salary or compensation range is mentioned
//
// Response format: array of objects [{c,s,e,sal}, ...] — one per job in order.
// Per-job objects are robust to partial responses; parallel arrays break on
// any off-by-one and corrupt everything after the misalignment.
//
// FAIL-OPEN: any error returns the original array unchanged.
// ─────────────────────────────────────────────────────────────────────────────

// In dev, api.groq.com blocks HTTP-origin CORS — route through the Vite proxy instead.
const GROQ_URL      = import.meta.env.DEV
  ? "/api/groq/openai/v1/chat/completions"
  : "https://api.groq.com/openai/v1/chat/completions";
const MODEL         = "llama-3.1-8b-instant";
const CACHE_KEY     = "cv-vault-groq-cache-v4"; // bumped — added groqSal field
const CACHE_TTL     = 7 * 24 * 60 * 60 * 1000;
const CHUNK_SIZE    = 6; // small enough for 8b to stay accurate across all fields
const DESC_CHARS    = 150; // shorter = ~half the tokens per chunk, stays under free-tier limit

const STACK_OPTIONS = ["React","Vue","Angular","Python","Node","TypeScript","Go","Rust","Java","Mobile","DevOps","Data"];

// ── Cache helpers ─────────────────────────────────────────────────────────────

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}"); }
  catch { return {}; }
}

function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); }
  catch { localStorage.removeItem(CACHE_KEY); }
}

function pruneCache(cache) {
  const cutoff = Date.now() - CACHE_TTL;
  return Object.fromEntries(Object.entries(cache).filter(([, v]) => v.at > cutoff));
}

// ── Single chunk call ─────────────────────────────────────────────────────────

async function classifyChunk(chunk, apiKey) {
  const lines = chunk.map((j, i) => {
    let line = `${i}. "${j.title}" at ${j.company} | ${j.location || "Remote"}`;
    if (j.descriptionSnippet) line += ` | ${j.descriptionSnippet.slice(0, DESC_CHARS)}`;
    return line;
  });

  const prompt =
    `You are a job data extractor. For each job return one JSON object with four fields.\n\n` +
    `Fields:\n` +
    `  c: 1 if open to Canadian remote workers, 0 if not\n` +
    `  s: primary tech stack — exactly one of: ${STACK_OPTIONS.join(", ")} — or null\n` +
    `  e: years of experience required — "0-2", "2-5", "5+", or null\n` +
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
    `  - Use the job title first — "React Engineer" = React\n` +
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
    `[{"c":1,"s":"React","e":"2-5","sal":1}, ...]\n\n` +
    `Jobs:\n` + lines.join("\n");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model:       MODEL,
      messages:    [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens:  chunk.length * 30 + 60,
    }),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}`);

  const data    = await res.json();
  const text    = data.choices?.[0]?.message?.content ?? "";
  const usage   = data.usage;
  console.log(`[Groq] chunk(${chunk.length}) — ${usage?.prompt_tokens ?? "?"}in / ${usage?.completion_tokens ?? "?"}out`);

  const arrMatch = text.match(/\[[\s\S]+\]/);
  const objMatch = text.match(/\{[\s\S]+\}/);
  if (!arrMatch && !objMatch) throw new Error("No JSON in response");

  const raw    = JSON.parse(arrMatch ? arrMatch[0] : objMatch[0]);
  const parsed = Array.isArray(raw) ? raw : [raw];
  return parsed;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function classifyJobs(jobs) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey || jobs.length === 0) return jobs;
  // Groq blocks residential/dev IPs with 403 "Access denied. Check network settings."
  // Classification runs fine in production (Cloudflare datacenter IPs are allowed).
  if (import.meta.env.DEV) return jobs;

  const cache    = pruneCache(loadCache());
  const uncached = jobs.filter(j => j.url && !cache[j.url]);
  const hits     = jobs.length - uncached.length;

  // Apply cached results immediately.
  // Jobs with _canadaSource === "source" (Himalayas, Remotive) have
  // API-confirmed Canada eligibility — don't let a stale Groq cache override it.
  const withCache = jobs.map(j => {
    const hit = j.url && cache[j.url];
    if (!hit) return j;
    const canadaOpen = j._canadaSource === "source" ? true : hit.canadaOpen;
    return { ...j, canadaOpen, groqStack: hit.groqStack, groqExp: hit.groqExp, groqSal: hit.groqSal };
  });

  if (uncached.length === 0) {
    console.log(`[Groq] All ${hits} cached — 0 tokens`);
    return withCache;
  }

  console.log(`[Groq] ${hits} cached, ${uncached.length} new — calling API in chunks of ${CHUNK_SIZE}...`);

  try {
    // Per-chunk try/catch: a 429 stops the loop early but saves whatever was classified.
    // Other chunk errors are skipped so remaining chunks still run.
    for (let i = 0; i < uncached.length; i += CHUNK_SIZE) {
      if (i > 0) await new Promise(r => setTimeout(r, 1200));
      const chunk = uncached.slice(i, i + CHUNK_SIZE);
      try {
        const results = await classifyChunk(chunk, apiKey);
        chunk.forEach((j, idx) => {
          if (!j.url) return;
          const r = results[idx] ?? {};
          cache[j.url] = {
            canadaOpen: r.c !== 0,
            groqStack:  STACK_OPTIONS.includes(r.s) ? r.s : null,
            groqExp:    ["0-2","2-5","5+"].includes(r.e) ? r.e : null,
            groqSal:    r.sal === 1,
            at:         Date.now(),
          };
        });
      } catch (err) {
        if (err.message.includes("429")) {
          console.warn(`[Groq] Rate limited after ${i} jobs — saving partial results`);
          break;
        }
        console.warn(`[Groq] Chunk at ${i} failed, skipping:`, err.message);
      }
    }

    saveCache(cache);

    const freshMap = new Map(uncached.map(j => [j.url, cache[j.url]]));
    const result   = withCache.map(j => {
      const fresh = j.url && freshMap.get(j.url);
      if (!fresh) return j;
      // Preserve API-confirmed Canada signal — Groq stack/exp still applied
      const canadaOpen = j._canadaSource === "source" ? true : fresh.canadaOpen;
      return { ...j, ...fresh, canadaOpen, groqSal: fresh.groqSal };
    });

    const caOpen = result.filter(j => j.canadaOpen).length;
    console.log(`[Groq] Done — ${caOpen}/${jobs.length} Canada-open (${Object.keys(cache).length} total cached)`);
    return result;

  } catch (err) {
    console.error("[Groq] Error:", err);
    return withCache;
  }
}
