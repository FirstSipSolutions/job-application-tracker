import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    configureServer(server) {
      // Workday: dynamic tenant per company — can't use static proxy target
      server.middlewares.use("/api/workday", async (req, res) => {
        const params = new URLSearchParams((req.url ?? "").split("?")[1] ?? "");
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
      server.middlewares.use("/api/workable", async (req, res) => {
        const params = new URLSearchParams((req.url ?? "").split("?")[1] ?? "");
        const slug   = params.get("slug") ?? "";
        res.setHeader("Content-Type", "application/json");
        if (!slug) { res.end(JSON.stringify({ results: [] })); return; }
        try {
          const r = await fetch(`https://apply.workable.com/api/v3/accounts/${slug}/jobs`);
          res.end(r.ok ? await r.text() : JSON.stringify({ results: [] }));
        } catch { res.end(JSON.stringify({ results: [] })); }
      });

      // Remote.co: blocks automated requests without browser-like headers
      server.middlewares.use("/api/remoteco", async (req, res) => {
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
      "/api/himalayas": {
        target: "https://himalayas.app",
        changeOrigin: true,
        rewrite: () => "/jobs/api/search?sort=recent&limit=100&q=software",
      },
      "/api/weworkremotely": {
        target: "https://weworkremotely.com",
        changeOrigin: true,
        rewrite: () => "/categories/remote-programming-jobs.rss",
      },
    },
  },
});
