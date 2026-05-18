const CACHE_KEY = "cv-vault-github-readme-v1";
const CACHE_TTL = 24 * 60 * 60 * 1000;

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}"); }
  catch { return {}; }
}

function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); }
  catch {}
}

export async function fetchGithubReadme(username) {
  if (!username?.trim()) return null;

  const slug = username.trim().toLowerCase();
  const cache = loadCache();
  const hit = cache[slug];
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.content;

  const urls = [
    `https://raw.githubusercontent.com/${username}/${username}/main/README.md`,
    `https://raw.githubusercontent.com/${username}/${username}/master/README.md`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const content = await res.text();
      cache[slug] = { content, at: Date.now() };
      saveCache(cache);
      return content;
    } catch {}
  }

  return null;
}

export function clearGithubCache(username) {
  const cache = loadCache();
  delete cache[username?.trim().toLowerCase()];
  saveCache(cache);
}
