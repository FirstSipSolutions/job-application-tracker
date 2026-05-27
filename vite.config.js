import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import https from "node:https";

export default defineConfig({
  plugins: [react()],
  server: {
    configureServer(server) {
      // ── Global middlewares ──────────────────────────────────────────────────
      // Using use(fn) (no path arg) to avoid Connect's path-stripping behaviour
      // which was silently corrupting req.url inside path-mounted handlers.
      // Each handler checks req.url explicitly and calls next() if not its route.

      // Workday: dynamic tenant per company — can't use static proxy target
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/workday")) return next();
        const params = new URLSearchParams(req.url.split("?")[1] ?? "");
        const tenant = params.get("tenant") ?? "";
        const board  = params.get("board")  ?? "";
        const wd     = params.get("wd")     ?? "3";
        const q      = params.get("q")      ?? "software developer";
        res.setHeader("Content-Type", "application/json");
        if (!tenant || !board) { res.end(JSON.stringify({ jobPostings: [] })); return; }
        try {
          const upstream = `https://${tenant}.wd${wd}.myworkdayjobs.com/wday/cxs/${tenant}/${board}/jobs`;
          const r = await fetch(upstream, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ limit: 100, offset: 0, searchText: q, appliedFacets: {} }),
          });
          res.end(r.ok ? await r.text() : JSON.stringify({ jobPostings: [] }));
        } catch { res.end(JSON.stringify({ jobPostings: [] })); }
      });

      // Workable: dynamic slug per company
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/workable")) return next();
        const params = new URLSearchParams(req.url.split("?")[1] ?? "");
        const slug   = params.get("slug") ?? "";
        res.setHeader("Content-Type", "application/json");
        if (!slug) { res.end(JSON.stringify({ results: [] })); return; }
        try {
          const r = await fetch(`https://apply.workable.com/api/v3/accounts/${slug}/jobs`);
          res.end(r.ok ? await r.text() : JSON.stringify({ results: [] }));
        } catch { res.end(JSON.stringify({ results: [] })); }
      });

      // Digital Nova Scotia: WordPress REST API
      // Converted from proxy to middleware for explicit logging and header control.
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/dns")) return next();
        const params = new URLSearchParams(req.url.split("?")[1] ?? "");
        const qs = new URLSearchParams({
          per_page: params.get("per_page") ?? "100",
          status:   params.get("status")   ?? "publish",
          page:     params.get("page")     ?? "1",
        });
        const url = `https://digitalnovascotia.com/wp-json/wp/v2/job_portal?${qs}`;
        console.log("[Vite/DNS] →", url);
        res.setHeader("Content-Type", "application/json");
        try {
          const r = await fetch(url, {
            headers: { "User-Agent": "CVVault/1.0", "Accept": "application/json" },
          });
          const text = await r.text();
          console.log("[Vite/DNS] status:", r.status, "| body:", text.slice(0, 120));
          res.statusCode = r.status;
          res.end(text);
        } catch (err) {
          console.error("[Vite/DNS] error:", err.message);
          res.statusCode = 500;
          res.end("[]");
        }
      });

      // Job Bank Canada: https module instead of fetch() —
      // Node's native fetch (undici) silently fails on gc.ca TLS chain on Windows.
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/api/jobbank")) return next();
        const params = new URLSearchParams(req.url.split("?")[1] ?? "");
        const term   = params.get("term") ?? "software developer";
        const qs     = new URLSearchParams({ searchstring: term, rows: "100" });
        const url    = `https://www.jobbank.gc.ca/jobsearch/feed/jobSearchRSSfeed?${qs}`;
        console.log("[Vite/JobBank] →", url);
        res.setHeader("Content-Type", "application/xml;charset=UTF-8");
        const outReq = https.get(url, {
          headers: { "User-Agent": "CVVault/1.0", "Accept": "application/atom+xml" },
        }, upstream => {
          let xml = "";
          upstream.setEncoding("utf8");
          upstream.on("data", chunk => { xml += chunk; });
          upstream.on("end",  () => {
            console.log("[Vite/JobBank] got", xml.length, "chars");
            res.end(xml || "<feed/>");
          });
        });
        outReq.on("error", err => {
          console.error("[Vite/JobBank] error:", err.message);
          res.end("<feed/>");
        });
      });

      // Groq: server-to-server call strips the browser's Origin header so Groq
      // doesn't see Origin: http://localhost which it rejects with CORS 403.
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/groq")) return next();
        const auth   = req.headers["authorization"] ?? "";
        const path   = req.url.replace(/^\/api\/groq/, "");
        const target = "https://api.groq.com" + path;
        console.log("[Vite/Groq] →", target, "| auth:", auth ? auth.slice(0, 20) + "…" : "MISSING");
        let body = "";
        try {
          body = await new Promise((resolve, reject) => {
            const chunks = [];
            req.on("data",  d => chunks.push(d));
            req.on("end",   () => resolve(Buffer.concat(chunks).toString()));
            req.on("error", reject);
          });
        } catch (err) {
          console.error("[Vite/Groq] body read error:", err.message);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "body read failed" }));
          return;
        }
        try {
          const r = await fetch(target, {
            method:  req.method,
            headers: { "Content-Type": "application/json", "Authorization": auth },
            body:    req.method !== "GET" && body ? body : undefined,
          });
          const text = await r.text();
          console.log("[Vite/Groq] status:", r.status, text.slice(0, 120));
          res.statusCode = r.status;
          res.setHeader("Content-Type", "application/json");
          res.end(text);
        } catch (err) {
          console.error("[Vite/Groq] fetch error:", err.message);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // Remote.co: blocks automated requests without browser-like headers
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/remoteco")) return next();
        res.setHeader("Content-Type", "application/rss+xml; charset=UTF-8");
        try {
          const r = await fetch("https://remote.co/remote-jobs/developer/feed/", {
            headers: {
              "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept":          "application/rss+xml, text/xml, */*",
              "Accept-Language": "en-US,en;q=0.9",
            },
          });
          res.statusCode = r.status;
          res.end(r.ok ? await r.text() : "");
        } catch { res.statusCode = 500; res.end(""); }
      });
    },
    proxy: {
      "/api/technl": {
        target:      "https://technl.ca",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/technl/, "/wp-json/wp/v2/job-listings") + "&_fields=id,title,link,date,meta,content",
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
});
