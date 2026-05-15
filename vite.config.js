import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/himalayas": {
        target: "https://himalayas.app",
        changeOrigin: true,
        rewrite: () => "/jobs/api/search?sort=recent&limit=100",
      },
      "/api/dns": {
        target: "https://digitalnovascotia.com",
        changeOrigin: true,
        rewrite: (path) => {
          const page = new URLSearchParams(path.split("?")[1] || "").get("page") || "1";
          return `/wp-json/wp/v2/job_portal?per_page=100&status=publish&page=${page}`;
        },
      },
      "/api/jobbank": {
        target: "https://www.jobbank.gc.ca",
        changeOrigin: true,
        rewrite: (path) => {
          const term = new URLSearchParams(path.split("?")[1] || "").get("term") || "software developer";
          return `/jobsearch/feed/jobSearchRSSfeed?searchstring=${encodeURIComponent(term)}&rows=100`;
        },
      },
    },
  },
});
