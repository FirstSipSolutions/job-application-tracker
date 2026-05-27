import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ─────────────────────────────────────────────────────────────────────────────
// Dev-server middleware plugin
//
// Workday and Workable need a per-request dynamic proxy target (the company
// tenant/slug comes in as a query param). Everything else uses server.proxy.
//
// NOTE: configureServer is a Vite *plugin* hook — it must live inside
// plugins[], NOT inside server{}.  Putting it in server{} is silently ignored.
// ─────────────────────────────────────────────────────────────────────────────
const devMiddlewarePlugin = {
  name: "dev-api-middleware",
  configureServer(server) {
    // Workday: target URL is per-company (tenant + board from query params)
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith("/api/workday")) return next();
      const p      = new URLSearchParams(req.url.split("?")[1] ?? "");
      const tenant = p.get("tenant") ?? "";
      const board  = p.get("board")  ?? "";
      const wd     = p.get("wd")     ?? "3";
      const q      = p.get("q")      ?? "software developer";
      res.setHeader("Content-Type", "application/json");
      if (!tenant || !board) { res.end(JSON.stringify({ jobPostings: [] })); return; }
      try {
        const r = await fetch(
          `https://${tenant}.wd${wd}.myworkdayjobs.com/wday/cxs/${tenant}/${board}/jobs`,
          { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ limit: 100, offset: 0, searchText: q, appliedFacets: {} }) },
        );
        res.end(r.ok ? await r.text() : JSON.stringify({ jobPostings: [] }));
      } catch { res.end(JSON.stringify({ jobPostings: [] })); }
    });

    // Workable: target URL is per-company (slug from query params)
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith("/api/workable")) return next();
      const slug = new URLSearchParams(req.url.split("?")[1] ?? "").get("slug") ?? "";
      res.setHeader("Content-Type", "application/json");
      if (!slug) { res.end(JSON.stringify({ results: [] })); return; }
      try {
        const r = await fetch(`https://apply.workable.com/api/v3/accounts/${slug}/jobs`);
        res.end(r.ok ? await r.text() : JSON.stringify({ results: [] }));
      } catch { res.end(JSON.stringify({ results: [] })); }
    });
  },
};

export default defineConfig({
  plugins: [react(), devMiddlewarePlugin],
  server: {
    proxy: {
      // ── Groq ──────────────────────────────────────────────────────────────
      // Groq rejects Origin: http://localhost (403).  Strip it so the upstream
      // request looks like a clean server-to-server call.
      "/api/groq": {
        target:      "https://api.groq.com",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/groq/, ""),
        configure: proxy => {
          proxy.on("proxyReq", proxyReq => {
            proxyReq.removeHeader("origin");
            proxyReq.removeHeader("referer");
          });
        },
      },

      // ── Digital Nova Scotia ───────────────────────────────────────────────
      "/api/dns": {
        target:      "https://digitalnovascotia.com",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/dns/, "/wp-json/wp/v2/job_portal"),
      },

      // ── Job Bank Canada ───────────────────────────────────────────────────
      // Translate ?term=<word> → ?searchstring=<word>&rows=100
      // URLSearchParams encodes spaces as + which Job Bank requires (%20 fails).
      // Vite proxy uses Node's https module (not undici) so gc.ca TLS works fine.
      "/api/jobbank": {
        target:      "https://www.jobbank.gc.ca",
        changeOrigin: true,
        rewrite: path => {
          const term = new URLSearchParams(path.split("?")[1] ?? "").get("term")
                    ?? "software developer";
          const qs   = new URLSearchParams({ searchstring: term, rows: "100" });
          return `/jobsearch/feed/jobSearchRSSfeed?${qs}`;
        },
      },

      // ── Remote.co ─────────────────────────────────────────────────────────
      // Blocks automated UA — send browser-like headers via proxyReq.
      "/api/remoteco": {
        target:      "https://remote.co",
        changeOrigin: true,
        rewrite: () => "/remote-jobs/developer/feed/",
        configure: proxy => {
          proxy.on("proxyReq", proxyReq => {
            proxyReq.setHeader("User-Agent",      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            proxyReq.setHeader("Accept",          "application/rss+xml, text/xml, */*");
            proxyReq.setHeader("Accept-Language", "en-US,en;q=0.9");
          });
        },
      },

      // ── Tech NL ───────────────────────────────────────────────────────────
      "/api/technl": {
        target:      "https://technl.ca",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/technl/, "/wp-json/wp/v2/job-listings") + "&_fields=id,title,link,date,meta,content",
      },

      // ── Himalayas ─────────────────────────────────────────────────────────
      "/api/himalayas": {
        target:      "https://himalayas.app",
        changeOrigin: true,
        rewrite: () => "/jobs/api/search?sort=recent&limit=100&q=software&countries=Canada,United+States",
      },

      // ── WeWorkRemotely ────────────────────────────────────────────────────
      "/api/weworkremotely": {
        target:      "https://weworkremotely.com",
        changeOrigin: true,
        rewrite: () => "/categories/remote-programming-jobs.rss",
      },
    },
  },
});
