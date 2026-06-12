// ── Groq Job Classifier ──────────────────────────────────────────────────────
//
// Classifies jobs in chunks of 6 via /api/classify (Cloudflare Pages Function
// in prod, Vite middleware in dev) so the Groq API key never reaches the
// browser. Results cached in localStorage by URL so return visits cost
// 0 tokens for already-seen jobs.
//
// Each job gets four fields:
//   canadaOpen - true if open to Canadian remote workers
//   groqStack  - primary tech stack (React, Node, Python, etc.)
//   groqExp    - experience required ("0-2" | "2-5" | "5+" | null)
//   groqSal    - true if a salary or compensation range is mentioned
//
// FAIL-OPEN: any error returns the original array unchanged.
// ─────────────────────────────────────────────────────────────────────────────

const CLASSIFY_URL  = "/api/classify";
const CACHE_KEY     = "cv-vault-groq-cache-v4"; // bumped - added groqSal field
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

async function classifyChunk(chunk) {
  const jobs = chunk.map(j => ({
    title:   j.title ?? "",
    company: j.company ?? "",
    location: j.location || "Remote",
    snippet: j.descriptionSnippet ? j.descriptionSnippet.slice(0, DESC_CHARS) : null,
  }));

  const res = await fetch(CLASSIFY_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ jobs }),
  });

  if (!res.ok) throw new Error(`Classify ${res.status}`);

  const { results, usage } = await res.json();
  console.log(`[Groq] chunk(${chunk.length}) - ${usage?.prompt_tokens ?? "?"}in / ${usage?.completion_tokens ?? "?"}out`);
  return results ?? [];
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function classifyJobs(jobs) {
  if (jobs.length === 0) return jobs;

  const cache    = pruneCache(loadCache());
  const uncached = jobs.filter(j => j.url && !cache[j.url]);
  const hits     = jobs.length - uncached.length;

  // Apply cached results immediately.
  // Jobs with _canadaSource === "source" (Himalayas, Remotive) have
  // API-confirmed Canada eligibility - don't let a stale Groq cache override it.
  const withCache = jobs.map(j => {
    const hit = j.url && cache[j.url];
    if (!hit) return j;
    const canadaOpen = j._canadaSource === "source" ? true : hit.canadaOpen;
    return { ...j, canadaOpen, groqStack: hit.groqStack, groqExp: hit.groqExp, groqSal: hit.groqSal };
  });

  if (uncached.length === 0) {
    console.log(`[Groq] All ${hits} cached - 0 tokens`);
    return withCache;
  }

  console.log(`[Groq] ${hits} cached, ${uncached.length} new - calling API in chunks of ${CHUNK_SIZE}...`);

  try {
    // Per-chunk try/catch: 429 (rate limit) and 503 (no key configured) stop
    // the loop early but save whatever was classified. Other chunk errors are
    // skipped so remaining chunks still run.
    for (let i = 0; i < uncached.length; i += CHUNK_SIZE) {
      if (i > 0) await new Promise(r => setTimeout(r, 1200));
      const chunk = uncached.slice(i, i + CHUNK_SIZE);
      try {
        const results = await classifyChunk(chunk);
        chunk.forEach((j, idx) => {
          if (!j.url) return;
          // Prefer index-matched result (model echoes i); fall back to position.
          // No result at all → leave uncached so the job is retried next run.
          const r = results.find(x => x?.i === idx) ?? results[idx];
          if (!r) return;
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
          console.warn(`[Groq] Rate limited after ${i} jobs - saving partial results`);
          break;
        }
        if (err.message.includes("503")) {
          console.warn("[Groq] Classification disabled - GROQ_API_KEY not configured");
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
      // Preserve API-confirmed Canada signal - Groq stack/exp still applied
      const canadaOpen = j._canadaSource === "source" ? true : fresh.canadaOpen;
      return { ...j, ...fresh, canadaOpen, groqSal: fresh.groqSal };
    });

    const caOpen = result.filter(j => j.canadaOpen).length;
    console.log(`[Groq] Done - ${caOpen}/${jobs.length} Canada-open (${Object.keys(cache).length} total cached)`);
    return result;

  } catch (err) {
    console.error("[Groq] Error:", err);
    return withCache;
  }
}
