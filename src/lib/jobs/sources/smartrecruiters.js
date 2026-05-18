import { fromSmartRecruiters } from "../normalize.js";

// SmartRecruiters returns Access-Control-Allow-Origin: * — no proxy needed.
// Company identifiers match the path on careers.smartrecruiters.com/{id}
const COMPANIES = [
  { name: "Canva",      id: "Canva",      category: "global-remote" },
  { name: "Freshworks", id: "Freshworks", category: "global-remote" },
];

const BASE       = "https://api.smartrecruiters.com/v1/companies";
const TIMEOUT_MS = 8000;

async function fetchOne({ name, id, category }) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `${BASE}/${id}/postings?status=PUBLIC&limit=100`,
      { signal: ctrl.signal }
    );
    if (!res.ok) return [];
    const { content } = await res.json();
    return (content ?? []).map(j => fromSmartRecruiters(j, name, category));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchSmartRecruiters() {
  const results = await Promise.allSettled(COMPANIES.map(fetchOne));
  return results.flatMap(r => r.status === "fulfilled" ? r.value : []);
}
