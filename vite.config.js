import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { classifyWithGroq, MAX_JOBS } from "./functions/api/_groq.js";

// Dev-only mirrors of the Cloudflare Pages Functions in functions/api/.
// These must live in a plugin: `configureServer` is a plugin hook and is
// silently ignored when placed under the `server` config option.
function devApiProxy(groqKey) {
  const json = (res, body) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
  };

  return {
    name: "dev-api-proxy",
    configureServer(server) {
      // Groq classification: keeps the API key out of the client bundle.
      // Reads GROQ_API_KEY from .env.local (prod uses a CF Pages secret).
      server.middlewares.use("/api/classify", async (req, res) => {
        if (req.method !== "POST") { res.statusCode = 405; return json(res, { error: "POST only" }); }
        if (!groqKey) { res.statusCode = 503; return json(res, { error: "GROQ_API_KEY not set in .env.local" }); }
        let raw = "";
        for await (const chunk of req) raw += chunk;
        let jobs;
        try { jobs = JSON.parse(raw).jobs; } catch { jobs = null; }
        if (!Array.isArray(jobs) || jobs.length === 0 || jobs.length > MAX_JOBS) {
          res.statusCode = 400;
          return json(res, { error: `jobs must contain 1-${MAX_JOBS} items` });
        }
        try {
          const out = await classifyWithGroq(jobs, groqKey);
          if (out.status !== 200) {
            res.statusCode = out.status === 429 ? 429 : 502;
            return json(res, { error: `Groq ${out.status}` });
          }
          json(res, { results: out.results, usage: out.usage });
        } catch (err) {
          console.error("[dev-api] classify:", err.message);
          res.statusCode = 502;
          json(res, { error: "Groq request failed" });
        }
      });

      // Workday: dynamic tenant per company - can't use a static proxy target.
      // With ?path=/job/... fetches a single posting's detail (description).
      server.middlewares.use("/api/workday", async (req, res) => {
        const params = new URLSearchParams((req.url ?? "").split("?")[1] ?? "");
        const tenant = params.get("tenant") ?? "";
        const board  = params.get("board")  ?? "";
        const wd     = params.get("wd")     ?? "3";
        const q      = params.get("q")      ?? "software developer";
        const path   = params.get("path")   ?? "";
        if (!tenant || !board) return json(res, { jobPostings: [] });
        try {
          const base = `https://${tenant}.wd${wd}.myworkdayjobs.com/wday/cxs/${tenant}/${board}`;
          const r = path.startsWith("/job/")
            ? await fetch(`${base}${path}`)
            : await fetch(`${base}/jobs`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                // Workday CXS rejects limit > 20 with HTTP 400
                body:    JSON.stringify({ limit: 20, offset: 0, searchText: q, appliedFacets: {} }),
              });
          if (!r.ok) {
            console.error(`[dev-api] workday ${tenant}/${board}: upstream ${r.status}`);
            return json(res, { jobPostings: [] });
          }
          res.setHeader("Content-Type", "application/json");
          res.end(await r.text());
        } catch (err) {
          console.error("[dev-api] workday:", err.message);
          json(res, { jobPostings: [] });
        }
      });

      // Job Bank Canada: Atom feed, search term in query
      server.middlewares.use("/api/jobbank", async (req, res) => {
        const params = new URLSearchParams((req.url ?? "").split("?")[1] ?? "");
        const term   = params.get("term") ?? "software developer";
        res.setHeader("Content-Type", "application/xml;charset=UTF-8");
        try {
          const r = await fetch(
            `https://www.jobbank.gc.ca/jobsearch/feed/jobSearchRSSfeed?searchstring=${encodeURIComponent(term)}&rows=100`,
            { headers: { "User-Agent": "CVVault/1.0", "Accept": "application/atom+xml" } },
          );
          res.end(r.ok ? await r.text() : "<feed/>");
        } catch { res.end("<feed/>"); }
      });

      // Digital Nova Scotia: WordPress REST API
      server.middlewares.use("/api/dns", async (req, res) => {
        const params = new URLSearchParams((req.url ?? "").split("?")[1] ?? "");
        const page   = params.get("page") ?? "1";
        try {
          const r = await fetch(`https://digitalnovascotia.com/wp-json/wp/v2/job_portal?per_page=100&status=publish&page=${page}`);
          if (!r.ok) return json(res, []);
          res.setHeader("Content-Type", "application/json");
          res.end(await r.text());
        } catch { json(res, []); }
      });

    },
  };
}

const ROOT = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [react(), devApiProxy(loadEnv(mode, ROOT, "").GROQ_API_KEY)],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    proxy: {
      "/api/technl": {
        target: "https://technl.ca",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/technl/, "/wp-json/wp/v2/job-listings") + "&_fields=id,title,link,date,meta,content",
      },
      "/api/himalayas": {
        target: "https://himalayas.app",
        changeOrigin: true,
        rewrite: () => "/jobs/api/search?sort=recent&limit=100&q=software&countries=Canada,United+States",
      },
      "/api/weworkremotely": {
        target: "https://weworkremotely.com",
        changeOrigin: true,
        rewrite: () => "/categories/remote-programming-jobs.rss",
      },
    },
  },
}));
