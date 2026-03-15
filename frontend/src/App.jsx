import { useState } from "react";

const mockData = [
  {
    id: 1,
    company_name: "Shopify",
    job_title: "Junior Developer",
    status: "interviewing",
    date_applied: "2026-03-01",
    job_url: "#",
    notes: "3rd round — system design",
  },
  {
    id: 2,
    company_name: "Cossette",
    job_title: "Frontend Engineer",
    status: "applied",
    date_applied: "2026-03-04",
    job_url: "#",
    notes: "",
  },
  {
    id: 3,
    company_name: "Ubisoft",
    job_title: "Web Developer",
    status: "rejected",
    date_applied: "2026-02-20",
    job_url: "#",
    notes: "No feedback given",
  },
  {
    id: 4,
    company_name: "FreshBooks",
    job_title: "React Developer",
    status: "draft",
    date_applied: null,
    job_url: "#",
    notes: "Still writing cover letter",
  },
  {
    id: 5,
    company_name: "Wealthsimple",
    job_title: "Software Engineer",
    status: "offered",
    date_applied: "2026-02-14",
    job_url: "#",
    notes: "Offer: $72k — deciding",
  },
];

const STATUS_CONFIG = {
  draft: { label: "DRAFT", color: "#4a4a5a" },
  applied: { label: "APPLIED", color: "#2d6be4" },
  interviewing: { label: "INTERVIEWING", color: "#d4a017" },
  offered: { label: "OFFERED", color: "#1d9c5a" },
  rejected: { label: "REJECTED", color: "#c0392b" },
  withdrawn: { label: "WITHDRAWN", color: "#7f5af0" },
};

const NAV_ITEMS = ["ALL", "APPLIED", "INTERVIEWING", "OFFERED", "REJECTED"];

export default function App() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);

  const filtered =
    activeFilter === "ALL"
      ? mockData
      : mockData.filter((a) => a.status.toUpperCase() === activeFilter);

  const counts = Object.fromEntries(
    Object.keys(STATUS_CONFIG).map((s) => [
      s,
      mockData.filter((a) => a.status === s).length,
    ]),
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0c0f",
        color: "#e8e4dc",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Playfair+Display:wght@700;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-tap-highlight-color: transparent; }
        *:focus, *:focus-visible { outline: none !important; box-shadow: none !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0b0c0f; }
        ::-webkit-scrollbar-thumb { background: #333; }
        .nav-item { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.12em; color: #555566; cursor: pointer; padding: 6px 0; transition: color 0.15s; background: none; border: none; border-bottom: 1px solid transparent; outline: none; -webkit-appearance: none; }
        .nav-item:hover { color: #e8e4dc; }
        .nav-item:focus { outline: none; box-shadow: none; }
        .nav-item.active { color: #c8ff00; border-bottom: 1px solid #c8ff00; }
        .row { display: grid; grid-template-columns: 28px 1fr 1fr 130px 110px 1fr; gap: 0 24px; padding: 14px 24px; border-bottom: 1px solid #1a1b20; align-items: center; transition: background 0.1s; cursor: pointer; }
        .row:hover { background: #111318; }
        .status-pill { display: inline-block; font-size: 9px; letter-spacing: 0.14em; font-weight: 600; padding: 3px 8px; border-radius: 2px; }
        .add-btn { background: #c8ff00; color: #0b0c0f; border: none; font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; padding: 9px 18px; cursor: pointer; transition: opacity 0.15s; outline: none; -webkit-appearance: none; }
        .add-btn:hover { opacity: 0.85; }
        .add-btn:focus { outline: none; box-shadow: none; }
        .col-header { font-size: 9px; letter-spacing: 0.16em; color: #3a3a4a; font-weight: 600; }
        .stat-block { padding: 14px 20px; border: 1px solid #1a1b20; flex: 1; }
        .ticker { animation: ticker 20s linear infinite; white-space: nowrap; }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .form-overlay { position: fixed; inset: 0; background: rgba(11,12,15,0.92); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px); }
        .form-panel { background: #111318; border: 1px solid #2a2b35; border-top: 2px solid #c8ff00; padding: 36px; width: 520px; max-width: 95vw; }
        .form-input { width: 100%; background: #0b0c0f; border: 1px solid #2a2b35; color: #e8e4dc; font-family: 'IBM Plex Mono', monospace; font-size: 12px; padding: 10px 12px; outline: none; transition: border-color 0.15s; }
        .form-input:focus { border-color: #c8ff00; outline: none; box-shadow: none; }
        .form-label { font-size: 9px; letter-spacing: 0.16em; color: #555566; display: block; margin-bottom: 6px; text-transform: uppercase; }
        .cancel-btn { background: none; border: 1px solid #2a2b35; color: #555566; font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.1em; padding: 9px 18px; cursor: pointer; outline: none; }
        .cancel-btn:focus { outline: none; box-shadow: none; }
      `}</style>

      {/* Header */}
      <div
        style={{ padding: "28px 24px 0", borderBottom: "1px solid #1a1b20" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.2em",
                color: "#555566",
                marginBottom: 8,
              }}
            >
              FIRST SIP SOLUTIONS &nbsp;/&nbsp; JOB APPLICATION TRACKER
            </div>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              THE PIPELINE
            </h1>
          </div>
          <button className="add-btn" onClick={() => setShowForm(true)}>
            + LOG APPLICATION
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 1, marginBottom: 24 }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="stat-block">
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: cfg.color,
                  lineHeight: 1,
                }}
              >
                {counts[key] || 0}
              </div>
              <div
                style={{
                  fontSize: 8,
                  letterSpacing: "0.14em",
                  color: "#3a3a4a",
                  marginTop: 4,
                }}
              >
                {cfg.label}
              </div>
            </div>
          ))}
        </div>

        {/* Nav */}
        <div style={{ display: "flex", gap: 28 }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              className={`nav-item ${activeFilter === item ? "active" : ""}`}
              onClick={() => setActiveFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div>
        <div className="row" style={{ cursor: "default" }}>
          {["#", "COMPANY", "ROLE", "STATUS", "APPLIED", "NOTES"].map((h) => (
            <div key={h} className="col-header">
              {h}
            </div>
          ))}
        </div>
        {filtered.map((app, i) => {
          const cfg = STATUS_CONFIG[app.status];
          return (
            <div key={app.id} className="row">
              <div style={{ fontSize: 10, color: "#3a3a4a" }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                {app.company_name}
              </div>
              <div style={{ fontSize: 11, color: "#888899" }}>
                {app.job_title}
              </div>
              <div>
                <span
                  className="status-pill"
                  style={{
                    background: cfg.color + "22",
                    color: cfg.color,
                    border: `1px solid ${cfg.color}44`,
                  }}
                >
                  {cfg.label}
                </span>
              </div>
              <div style={{ fontSize: 10, color: "#555566" }}>
                {app.date_applied || "—"}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#555566",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {app.notes || "—"}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: "#3a3a4a",
              fontSize: 11,
              letterSpacing: "0.1em",
            }}
          >
            NO ENTRIES MATCH THIS FILTER
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "20px 24px",
          borderTop: "1px solid #1a1b20",
          display: "flex",
          justifyContent: "space-between",
          marginTop: 40,
        }}
      >
        <span
          style={{ fontSize: 9, color: "#2a2b35", letterSpacing: "0.15em" }}
        >
          FSS · JOB-APPLICATION-TRACKER · MVP
        </span>
        <span
          style={{ fontSize: 9, color: "#2a2b35", letterSpacing: "0.15em" }}
        >
          {new Date().toISOString().split("T")[0]}
        </span>
      </div>

      {/* Form modal */}
      {showForm && (
        <div
          className="form-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="form-panel">
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.2em",
                color: "#c8ff00",
                marginBottom: 4,
              }}
            >
              NEW ENTRY
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 28,
                fontWeight: 900,
                marginBottom: 28,
              }}
            >
              Log Application
            </h2>
            <div style={{ display: "grid", gap: 18 }}>
              {[
                ["COMPANY NAME", "e.g. Shopify"],
                ["JOB TITLE", "e.g. Junior Developer"],
                ["JOB URL", "https://..."],
                ["DATE APPLIED", "YYYY-MM-DD"],
              ].map(([label, ph]) => (
                <div key={label}>
                  <label className="form-label">{label}</label>
                  <input className="form-input" placeholder={ph} />
                </div>
              ))}
              <div>
                <label className="form-label">NOTES</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Recruiter name, salary, anything..."
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              <button className="add-btn" style={{ flex: 1 }}>
                SAVE APPLICATION
              </button>
              <button className="cancel-btn" onClick={() => setShowForm(false)}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
