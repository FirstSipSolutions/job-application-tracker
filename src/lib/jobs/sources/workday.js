const COMPANIES = [
  { name: "Shopify", tenant: "shopify", instance: "wd3", board: "Shopify", category: "canadian" },
];

const TIMEOUT_MS = 10000;

async function fetchOne({ name, tenant, instance, board, category }) {
  const baseUrl = `https://${tenant}.${instance}.myworkdayjobs.com`;
  const url = `${baseUrl}/wday/cxs/${tenant}/${board}/jobs`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: 0, searchText: "" }),
      signal: ctrl.signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobPostings ?? []).map(j => ({
      id:            `wd-${(j.externalPath ?? Math.random().toString(36).slice(2)).replace(/\//g, "-")}`,
      title:         j.title ?? "",
      company:       name,
      location:      j.locationsText ?? "",
      workplaceType: /remote/i.test(j.locationsText ?? "") ? "Remote" : j.locationsText ?? "",
      salary:        null,
      currency:      null,
      postedAt:      j.postedOn ? new Date(j.postedOn).toISOString() : null,
      url:           j.externalPath ? `${baseUrl}${j.externalPath}` : "",
      source:        "Workday",
      category,
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchWorkday() {
  const results = await Promise.allSettled(COMPANIES.map(fetchOne));
  return results.flatMap(r => r.status === "fulfilled" ? r.value : []);
}
