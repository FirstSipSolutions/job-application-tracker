import { useState, useEffect } from "react";
import { createApplication, getApplications } from "./api/applications";

// Mock data stays until issue #8 wires the GET endpoint
// At that point this gets replaced with a useEffect that fetches from the DB
// const mockData = [
//   {
//     id: 1,
//     company_name: "Shopify",
//     job_title: "Junior Developer",
//     status: "interviewing",
//     date_applied: "2026-03-01",
//     job_url: "#",
//     notes: "3rd round — system design",
//   },
//   {
//     id: 2,
//     company_name: "Cossette",
//     job_title: "Frontend Engineer",
//     status: "applied",
//     date_applied: "2026-03-04",
//     job_url: "#",
//     notes: "",
//   },
//   {
//     id: 3,
//     company_name: "Ubisoft",
//     job_title: "Web Developer",
//     status: "rejected",
//     date_applied: "2026-02-20",
//     job_url: "#",
//     notes: "No feedback given",
//   },
//   {
//     id: 4,
//     company_name: "FreshBooks",
//     job_title: "React Developer",
//     status: "draft",
//     date_applied: null,
//     job_url: "#",
//     notes: "Still writing cover letter",
//   },
//   {
//     id: 5,
//     company_name: "Wealthsimple",
//     job_title: "Software Engineer",
//     status: "offered",
//     date_applied: "2026-02-14",
//     job_url: "#",
//     notes: "Offer: $72k — deciding",
//   },
// ];

const STATUS_CONFIG = {
  draft: { label: "DRAFT", color: "#3a3a4a" },
  applied: { label: "APPLIED", color: "#2d6be4" },
  interviewing: { label: "INTERVIEWING", color: "#d4a017" },
  offered: { label: "OFFERED", color: "#1d9c5a" },
  rejected: { label: "REJECTED", color: "#c0392b" },
  withdrawn: { label: "WITHDRAWN", color: "#8888aa" },
};

const NAV_ITEMS = [
  "ALL",
  "APPLIED",
  "INTERVIEWING",
  "OFFERED",
  "REJECTED",
  "DRAFT",
];

export default function App() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);

  // applications holds the live list — starts with mockData, grows as you add real ones
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    getApplications().then((data) => setApplications(data));
  }, []);

  // form tracks exactly what's typed in each field right now
  const [form, setForm] = useState({
    company_name: "",
    job_title: "",
    job_url: "",
    date_applied: "",
    notes: "",
  });

  // handleSubmit fires when you click SAVE APPLICATION
  // it sends the form data to your POST endpoint and adds the new row to the top of the table
  const handleSubmit = async () => {
    if (!form.company_name || !form.job_title) return; // don't submit if required fields are empty
    const result = await createApplication(form);
    setApplications([result, ...applications]); // prepend new row — newest first
    setForm({
      company_name: "",
      job_title: "",
      job_url: "",
      date_applied: "",
      notes: "",
    }); // reset form
    setShowForm(false); // close modal
  };

  // filtered and counts now use the live applications array instead of hardcoded mockData
  const filtered =
    activeFilter === "ALL"
      ? applications
      : applications.filter((a) => a.status.toUpperCase() === activeFilter);

  const counts = Object.fromEntries(
    Object.keys(STATUS_CONFIG).map((s) => [
      s,
      applications.filter((a) => a.status === s).length,
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
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,900;1,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-tap-highlight-color: transparent; }
        *:focus, *:focus-visible { outline: none !important; box-shadow: none !important; }
        body { margin: 0; background: #0b0c0f; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #0b0c0f; }
        ::-webkit-scrollbar-thumb { background: #555566; }
        .nav-btn { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.14em; color: #3a3a4a; cursor: pointer; padding: 8px 0; background: none; border: none; border-bottom: 1px solid transparent; transition: color 0.12s; outline: none; -webkit-appearance: none; }
        .nav-btn:hover { color: #666677; }
        .nav-btn.active { color: #e8e4dc; border-bottom: 1px solid #e8e4dc; }
        .row { display: grid; grid-template-columns: 32px 1.8fr 1.4fr 120px 100px 1fr; gap: 0 20px; padding: 13px 32px; border-bottom: 1px solid #13141a; align-items: center; transition: background 0.08s; }
        .row.clickable:hover { background: #0f1015; }
        .status-tag { display: inline-block; font-size: 8px; letter-spacing: 0.16em; font-weight: 600; padding: 2px 7px; border-radius: 1px; }
        .log-btn { background: #e8e4dc; color: #0b0c0f; border: none; font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; padding: 8px 16px; cursor: pointer; transition: background 0.12s; outline: none; -webkit-appearance: none; }
        .log-btn:hover { background: #ccc9c0; }
        .stat-block { flex: 1; padding: 14px 18px; border-right: 1px solid #13141a; }
        .stat-block:last-child { border-right: none; }
        .overlay { position: fixed; inset: 0; background: rgba(7,8,10,0.94); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(6px); }
        .panel { background: #0f1015; border: 1px solid #1e1f28; padding: 40px; width: 500px; max-width: 95vw; }
        .field { width: 100%; background: #0b0c0f; border: none; border-bottom: 1px solid #1e1f28; color: #e8e4dc; font-family: 'IBM Plex Mono', monospace; font-size: 12px; padding: 8px 0; outline: none; transition: border-color 0.12s; }
        .field:focus { border-bottom-color: #3a3a55; }
        .field::placeholder { color: #555566; }
        .field-label { font-size: 8px; letter-spacing: 0.18em; color: #2a2b35; display: block; margin-bottom: 4px; text-transform: uppercase; }
        .save-btn { flex: 1; background: #e8e4dc; color: #0b0c0f; border: none; font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; padding: 10px; cursor: pointer; outline: none; transition: background 0.12s; }
        .save-btn:hover { background: #ccc9c0; }
        .close-btn { background: none; border: 1px solid #1e1f28; color: #3a3a4a; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.12em; padding: 10px 18px; cursor: pointer; outline: none; transition: border-color 0.12s; }
        .close-btn:hover { border-color: #3a3a4a; color: #666677; }
      `}</style>

      {/* Header */}
      <div
        style={{ padding: "32px 32px 0", borderBottom: "1px solid #13141a" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 28,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 8,
                letterSpacing: "0.22em",
                color: "#555566",
                marginBottom: 10,
              }}
            >
              FIRST SIP SOLUTIONS / JOB APPLICATION TRACKER
            </div>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(36px, 5vw, 56px)",
                fontWeight: 900,
                lineHeight: 0.95,
                letterSpacing: "-0.02em",
                color: "#e8e4dc",
              }}
            >
              The
              <br />
              <em style={{ fontStyle: "italic", color: "#8888aa" }}>
                Pipeline
              </em>
            </h1>
          </div>
          <button className="log-btn" onClick={() => setShowForm(true)}>
            + LOG APPLICATION
          </button>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            borderTop: "1px solid #13141a",
            borderLeft: "1px solid #13141a",
          }}
        >
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="stat-block">
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 300,
                  color: cfg.color,
                  lineHeight: 1,
                }}
              >
                {counts[key] || 0}
              </div>
              <div
                style={{
                  fontSize: 7,
                  letterSpacing: "0.18em",
                  color: "#555566",
                  marginTop: 5,
                }}
              >
                {cfg.label}
              </div>
            </div>
          ))}
        </div>

        {/* Nav */}
        <div style={{ display: "flex", gap: 24, marginTop: 20 }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              className={`nav-btn ${activeFilter === item ? "active" : ""}`}
              onClick={() => setActiveFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div className="row" style={{ marginTop: 2 }}>
        {["", "COMPANY", "ROLE", "STATUS", "DATE", "NOTES"].map((h) => (
          <div
            key={h}
            style={{
              fontSize: 7,
              letterSpacing: "0.2em",
              color: "#555566",
              fontWeight: 600,
            }}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      {filtered.map((app, i) => {
        const cfg = STATUS_CONFIG[app.status];
        return (
          <div key={app.id} className="row clickable">
            <div style={{ fontSize: 9, color: "#555566", fontWeight: 300 }}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                color: "#e8e4dc",
              }}
            >
              {app.company_name}
            </div>
            <div style={{ fontSize: 10, color: "#8888aa", fontWeight: 300 }}>
              {app.job_title}
            </div>
            <div>
              <span
                className="status-tag"
                style={{
                  background: cfg.color + "18",
                  color: cfg.color,
                  border: `1px solid ${cfg.color}30`,
                }}
              >
                {cfg.label}
              </span>
            </div>
            <div style={{ fontSize: 9, color: "#555566" }}>
              {app.date_applied || "—"}
            </div>
            <div
              style={{
                fontSize: 9,
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
            padding: "60px 32px",
            textAlign: "center",
            fontSize: 9,
            letterSpacing: "0.2em",
            color: "#1e1f28",
          }}
        >
          NO ENTRIES
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          padding: "24px 32px",
          borderTop: "1px solid #13141a",
          display: "flex",
          justifyContent: "space-between",
          marginTop: 48,
        }}
      >
        <span
          style={{ fontSize: 8, color: "#1e1f28", letterSpacing: "0.18em" }}
        >
          FSS · JOB-APPLICATION-TRACKER · MVP
        </span>
        <span
          style={{ fontSize: 8, color: "#1e1f28", letterSpacing: "0.18em" }}
        >
          {new Date().toISOString().split("T")[0]}
        </span>
      </div>

      {/* Form modal */}
      {showForm && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="panel">
            <div
              style={{
                fontSize: 8,
                letterSpacing: "0.22em",
                color: "#555566",
                marginBottom: 6,
              }}
            >
              NEW ENTRY
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 26,
                fontWeight: 900,
                marginBottom: 32,
                color: "#e8e4dc",
              }}
            >
              Log Application
            </h2>
            <div style={{ display: "grid", gap: 20 }}>
              {/* Each input is controlled — it reads from form state and updates it on every keystroke */}
              <div>
                <label className="field-label">COMPANY NAME</label>
                <input
                  className="field"
                  placeholder="e.g. Shopify"
                  value={form.company_name}
                  onChange={(e) =>
                    setForm({ ...form, company_name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="field-label">JOB TITLE</label>
                <input
                  className="field"
                  placeholder="e.g. Junior Developer"
                  value={form.job_title}
                  onChange={(e) =>
                    setForm({ ...form, job_title: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="field-label">JOB URL</label>
                <input
                  className="field"
                  placeholder="https://..."
                  value={form.job_url}
                  onChange={(e) =>
                    setForm({ ...form, job_url: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="field-label">DATE APPLIED</label>
                <input
                  className="field"
                  placeholder="YYYY-MM-DD"
                  value={form.date_applied}
                  onChange={(e) =>
                    setForm({ ...form, date_applied: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="field-label">NOTES</label>
                <textarea
                  className="field"
                  rows={3}
                  placeholder="Recruiter, salary, anything..."
                  style={{ resize: "none", width: "100%" }}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 32 }}>
              {/* onClick calls handleSubmit which hits the POST endpoint */}
              <button className="save-btn" onClick={handleSubmit}>
                SAVE APPLICATION
              </button>
              <button className="close-btn" onClick={() => setShowForm(false)}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
