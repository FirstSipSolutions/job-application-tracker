// Parses a GitHub profile README into a structured user profile via Groq.
// Result cached in localStorage — only re-runs when README content changes.

const GROQ_URL  = "https://api.groq.com/openai/v1/chat/completions";
const MODEL     = "llama-3.1-8b-instant";
const CACHE_KEY = "cv-vault-user-profile-v1";

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null"); }
  catch { return null; }
}

function saveCache(profile) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(profile)); }
  catch {}
}

export function loadUserProfile() {
  return loadCache();
}

export async function parseGithubProfile(readmeContent, apiKey) {
  if (!readmeContent || !apiKey) return null;

  const cached = loadCache();
  if (cached && cached.readmeHash === simpleHash(readmeContent)) return cached;

  const prompt =
    `You are extracting a developer's job search profile from their GitHub README.\n\n` +
    `Return a single JSON object with these fields:\n` +
    `  name: string or null\n` +
    `  title: string (e.g. "Full Stack Developer") or null\n` +
    `  stack: array of up to 8 primary technologies (e.g. ["React","TypeScript","Node.js","PostgreSQL"])\n` +
    `  experienceYears: number or null (best guess from context)\n` +
    `  level: "junior" | "mid" | "senior" | null\n` +
    `  remote: true if they mention remote or Canada, false otherwise\n` +
    `  targetSalaryCAD: number or null (annual, if mentioned)\n` +
    `  summary: one sentence describing their profile for a recruiter\n\n` +
    `Rules:\n` +
    `  - Skill badge images like "skillicons.dev?i=react,ts,node" count as stack signals\n` +
    `  - "Currently learning X" means X is emerging skill, not primary\n` +
    `  - If no experience years stated, guess from stack depth and project complexity\n` +
    `  - Reply ONLY with valid JSON, no markdown\n\n` +
    `README:\n${readmeContent.slice(0, 3000)}`;

  try {
    const res = await fetch(GROQ_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model:       MODEL,
        messages:    [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens:  300,
      }),
    });

    if (!res.ok) throw new Error(`Groq ${res.status}`);

    const data   = await res.json();
    const text   = data.choices?.[0]?.message?.content ?? "";
    const match  = text.match(/\{[\s\S]+\}/);
    if (!match) throw new Error("No JSON in response");

    const profile = { ...JSON.parse(match[0]), readmeHash: simpleHash(readmeContent), parsedAt: Date.now() };
    saveCache(profile);
    console.log("[Profile] Parsed from GitHub README:", profile);
    return profile;

  } catch (err) {
    console.warn("[Profile] Parse failed:", err.message);
    return null;
  }
}

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h;
}

// Returns a match score (0-100) and a one-line reason for a given job.
export function matchScore(job, profile) {
  if (!profile?.stack?.length) return null;

  const jobText = `${job.title ?? ""} ${job.groqStack ?? ""} ${job.descriptionSnippet ?? ""}`.toLowerCase();
  const userStack = profile.stack.map(s => s.toLowerCase());

  const hits = userStack.filter(tech => jobText.includes(tech.toLowerCase()));
  const score = Math.round((hits.length / Math.max(userStack.length, 1)) * 100);

  let reason = null;
  if (hits.length >= 3)      reason = `Strong match — ${hits.slice(0, 3).join(", ")}`;
  else if (hits.length === 2) reason = `Partial match — ${hits.join(", ")}`;
  else if (hits.length === 1) reason = `Weak match — only ${hits[0]}`;
  else                        reason = "No stack overlap detected";

  return { score, reason, hits };
}
