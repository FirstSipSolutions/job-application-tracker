import { useState, useEffect } from "react";
import { createApplication, getApplications } from "./api/applications";
import ApplicationTable from "./components/ApplicationTable";

// STATUS_CONFIG is the single source of truth for how each status looks across the app.
// The key matches what's stored in the DB (lowercase ENUM value).
// label = what gets displayed in the UI
// color = the hex used for the badge background, text, and border
const STATUS_CONFIG = {
  draft: { label: "DRAFT", color: "#3a3a4a" },
  applied: { label: "APPLIED", color: "#2d6be4" },
  interviewing: { label: "INTERVIEWING", color: "#d4a017" },
  offered: { label: "OFFERED", color: "#1d9c5a" },
  rejected: { label: "REJECTED", color: "#c0392b" },
  withdrawn: { label: "WITHDRAWN", color: "#8888aa" },
};

// NAV_ITEMS drives the filter buttons at the top of the dashboard.
// "ALL" is a special case handled in the filter logic below — it's not a DB status.
const NAV_ITEMS = [
  "ALL",
  "APPLIED",
  "INTERVIEWING",
  "OFFERED",
  "REJECTED",
  "DRAFT",
];

export default function App() {
  // activeFilter tracks which nav button is selected.
  // Defaults to "ALL" so everything shows on first load.
  const [activeFilter, setActiveFilter] = useState("ALL");

  // showForm controls whether the "Log Application" modal is visible.
  // true = modal open, false = modal closed.
  const [showForm, setShowForm] = useState(false);

  // applications is the live array of job applications pulled from the DB.
  // Starts empty — the useEffect below populates it on mount.
  const [applications, setApplications] = useState([]);

  // useEffect with an empty dependency array [] runs once when the component mounts.
  // It calls getApplications() which hits GET /api/applications on the backend.
  // When the data comes back, it sets the applications state — which triggers a re-render
  // and populates the table with real DB rows.
  useEffect(() => {
    getApplications().then((data) => setApplications(data));
  }, []);

  // form tracks the current value of every field in the "Log Application" modal.
  // Each key maps directly to a column in the applications table.
  // This is a controlled form — every keystroke updates state here.
  const [form, setForm] = useState({
    company_name: "",
    job_title: "",
    job_url: "",
    date_applied: "",
    notes: "",
  });

  // handleSubmit fires when the user clicks SAVE APPLICATION.
  // It validates the required fields, sends the data to the backend via POST,
  // prepends the new row to the top of the table, resets the form, and closes the modal.
  const handleSubmit = async () => {
    // Guard: don't submit if the two required fields are empty
    if (!form.company_name || !form.job_title) return;

    // createApplication sends POST /api/applications with the form data as JSON.
    // The backend inserts the row and returns the full new row including id and created_at.
    const result = await createApplication(form);

    // Prepend the new row to the top of the list (newest first — matches DB order)
    setApplications([result, ...applications]);

    // Reset all form fields back to empty strings
    setForm({
      company_name: "",
      job_title: "",
      job_url: "",
      date_applied: "",
      notes: "",
    });

    // Close the modal
    setShowForm(false);
  };

  // filtered is what actually gets rendered in the table.
  // If activeFilter is "ALL", show everything.
  // Otherwise, compare each application's status (uppercased) against the active filter.
  // This runs on every render — no extra state needed.
  const filtered =
    activeFilter === "ALL"
      ? applications
      : applications.filter((a) => a.status.toUpperCase() === activeFilter);

  // counts builds an object like { draft: 2, applied: 5, interviewing: 1, ... }
  // Used to show the count numbers in the stats bar at the top.
  // Object.fromEntries turns an array of [key, value] pairs back into an object.
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
      {/* All CSS lives here as a single injected style block.
          This keeps the component self-contained — no external CSS file needed.
          CSS classes like .row, .nav-btn, .status-tag are used throughout the JSX below. */}
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

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
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
          {/* Clicking this sets showForm to true, which renders the modal below */}
          <button className="log-btn" onClick={() => setShowForm(true)}>
            + LOG APPLICATION
          </button>
        </div>

        {/* ── STATS BAR ──────────────────────────────────────────────────────── */}
        {/* Iterates over STATUS_CONFIG to render one stat block per status.
            Each block shows the count of applications with that status.
            counts[key] comes from the derived counts object calculated above. */}
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

        {/* ── FILTER NAV ─────────────────────────────────────────────────────── */}
        {/* Each button sets activeFilter, which updates the filtered array above.
            The "active" class on the matching button adds the underline highlight. */}
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

      {/* ── TABLE HEADER ─────────────────────────────────────────────────────── */}
      {/* Static column labels — must match the grid-template-columns in .row CSS */}
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

      {/* ── TABLE ROWS ───────────────────────────────────────────────────────── */}
      {/* ApplicationTable receives the filtered array and STATUS_CONFIG as props.
          It handles rendering each row and the empty state.

          this is where DeleteButton, EditModal, and StatusDropdown in here. */}

      <ApplicationTable applications={filtered} STATUS_CONFIG={STATUS_CONFIG} />

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
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
        {/* Dynamically renders today's date in YYYY-MM-DD format */}
        <span
          style={{ fontSize: 8, color: "#1e1f28", letterSpacing: "0.18em" }}
        >
          {new Date().toISOString().split("T")[0]}
        </span>
      </div>

      {/* ── FORM MODAL ───────────────────────────────────────────────────────── */}
      {/* Only renders when showForm is true.
          Clicking the overlay background (not the panel itself) closes the modal.
          e.target === e.currentTarget checks that the click was on the overlay, not a child. */}
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
              {/* Each input is a controlled component.
                  value reads from form state, onChange writes back to it.
                  The spread { ...form } keeps all other fields intact when one changes. */}

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
                  onChange={(e) => {
                    let val = e.target.value;
                    // Auto-prefix: if the user types anything that doesn't already
                    // start with http:// or https://, prepend https:// automatically.
                    // This prevents Zod or the browser from rejecting bare URLs like
                    // "www.shopify.com" or "linkedin.com/jobs/123".
                    if (
                      val &&
                      !val.startsWith("http://") &&
                      !val.startsWith("https://")
                    ) {
                      val = "https://" + val;
                    }
                    setForm({ ...form, job_url: val });
                  }}
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
              {/* SAVE triggers handleSubmit — validates, posts to backend, updates table */}
              <button className="save-btn" onClick={handleSubmit}>
                SAVE APPLICATION
              </button>
              {/* CANCEL just closes the modal without saving anything */}
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
