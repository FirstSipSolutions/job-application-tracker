// ── Company Memory ────────────────────────────────────────────────────────────
//
// Persists what we learn about each company's Canada eligibility across sessions.
// Over time this replaces Groq guesses with real signals — either from the user
// clicking Apply (strongest signal: they're hiring you, a Canadian) or from
// Groq's classification being confirmed repeatedly.
//
// Source hierarchy (highest wins):
//   "source"   → definitively known from API data (e.g. Remotive location field)
//   "user"     → user clicked Apply — they are clearly hiring Canadians
//   "groq"     → AI guess — useful but can be overridden
//
// Format in localStorage:
//   { "stripe": { canadaOpen: true, source: "groq", updatedAt: 1234567890 } }
// ─────────────────────────────────────────────────────────────────────────────

const KEY = "cv-vault-company-memory-v1";

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { return {}; }
}

function save(store) {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {}
}

function rank(source) {
  return source === "source" ? 3 : source === "user" ? 2 : 1; // groq = 1
}

// Returns { canadaOpen, source, updatedAt } or null if unknown.
export function getCompanyKnowledge(companyName) {
  if (!companyName) return null;
  return load()[companyName.toLowerCase().trim()] ?? null;
}

// Learn something about a company. Higher-ranked sources never get overwritten.
export function learnCompany(companyName, canadaOpen, source = "groq") {
  if (!companyName) return;
  const store    = load();
  const key      = companyName.toLowerCase().trim();
  const existing = store[key];
  if (existing && rank(existing.source) >= rank(source)) return; // don't downgrade
  store[key] = { canadaOpen, source, updatedAt: Date.now() };
  save(store);
}

// Call when user clicks Apply — their action is the strongest Canada signal.
export function markApplied(companyName) {
  learnCompany(companyName, true, "user");
}

// Apply memory overrides to a list of scored jobs.
// Known companies get their canadaOpen overridden; unknown ones get Groq's value.
// Also teaches Groq results back into memory for next session.
export function applyMemory(jobs) {
  const store = load();
  const updates = {};

  const result = jobs.map(j => {
    const key   = (j.company ?? "").toLowerCase().trim();
    const known = store[key];

    if (known) {
      return { ...j, canadaOpen: known.canadaOpen };
    }

    // Learn from Groq or pre-filled source values for next time
    if (j.canadaOpen !== undefined) {
      const src = j._canadaSource ?? "groq";
      if (!store[key] || rank(store[key].source) < rank(src)) {
        updates[key] = { canadaOpen: j.canadaOpen, source: src, updatedAt: Date.now() };
      }
    }
    return j;
  });

  if (Object.keys(updates).length) {
    save({ ...store, ...updates });
  }

  return result;
}
