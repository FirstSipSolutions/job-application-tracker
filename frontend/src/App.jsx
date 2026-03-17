import { useState, useMemo, useEffect } from "react";
import {
  createApplication,
  getApplications,
  deleteApplication,
} from "./api/applications";
import ApplicationTable from "./components/ApplicationTable";
import "./index.css";

const STATUS_CONFIG = {
  draft: { label: "DRAFT", color: "#9e9e9e" },
  applied: { label: "APPLIED", color: "#5b9bd5" },
  interviewing: { label: "INTERVIEWING", color: "#e0a84b" },
  offered: { label: "OFFERED", color: "#4cad7c" },
  rejected: { label: "REJECTED", color: "#d96b6b" },
  withdrawn: { label: "WITHDRAWN", color: "#a0a0b0" },
};

const NAV_ITEMS = [
  "ALL",
  "APPLIED",
  "INTERVIEWING",
  "OFFERED",
  "REJECTED",
  "DRAFT",
];

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function App() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({
    company_name: "",
    job_title: "",
    job_url: "",
    date_applied: "",
    notes: "",
  });

  useEffect(() => {
    getApplications()
      .then((data) => setApplications(data))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!form.company_name || !form.job_title) return;
    const result = await createApplication(form);
    setApplications([result, ...applications]);
    setForm({
      company_name: "",
      job_title: "",
      job_url: "",
      date_applied: "",
      notes: "",
    });
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    await deleteApplication(id);
    setApplications(applications.filter((a) => a.id !== id));
  };

  const filtered = useMemo(() => {
    let list =
      activeFilter === "ALL"
        ? applications
        : applications.filter((a) => a.status.toUpperCase() === activeFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.job_title?.toLowerCase().includes(q) ||
          a.company_name?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [applications, activeFilter, searchQuery]);

  const counts = Object.fromEntries(
    Object.keys(STATUS_CONFIG).map((s) => [
      s,
      applications.filter((a) => a.status === s).length,
    ]),
  );

  const thisMonth = applications.filter((a) => {
    if (!a.created_at) return false;
    const d = new Date(a.created_at);
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;

  const recentApplications = applications.slice(0, 5);

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
      {/* ── HEADER ── */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 48,
        }}
      >
        <h1
          style={{
            fontSize: "clamp(22px, 4vw, 32px)",
            fontWeight: 300,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "#e8e2d9",
            margin: 0,
          }}
        >
          JOB <span style={{ color: "#c9a96e", fontWeight: 500 }}>TRACKER</span>
        </h1>
        <button className="glow-button" onClick={() => setShowForm(true)}>
          + Log Application
        </button>
      </header>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 32 }}
      >
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
            }}
          >
            {[
              {
                label: "This Month",
                value: `+${thisMonth}`,
                sub: "Applications",
              },
              { label: "Total", value: applications.length, sub: "Life-time" },
              {
                label: "Interviews",
                value: counts.interviewing || 0,
                sub: "Active Stage",
              },
              { label: "Offers", value: counts.offered || 0, sub: "Received" },
            ].map((s) => (
              <div key={s.label} className="glass-card" style={{ padding: 24 }}>
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.18em",
                    color: "rgba(212,175,55,0.5)",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 300,
                    color: "white",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.3)",
                    marginTop: 6,
                  }}
                >
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Search + filter tabs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input
              type="text"
              placeholder="Search companies or job titles..."
              className="glass-card"
              style={{
                padding: "12px 16px",
                fontSize: 13,
                color: "white",
                background: "transparent",
                outline: "none",
                width: "100%",
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div
              style={{
                display: "flex",
                gap: 24,
                borderBottom: "1px solid rgba(212,175,55,0.05)",
              }}
            >
              {NAV_ITEMS.map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveFilter(item)}
                  style={{
                    background: "none",
                    border: "none",
                    borderBottom:
                      activeFilter === item
                        ? "1px solid white"
                        : "1px solid transparent",
                    color:
                      activeFilter === item ? "white" : "rgba(255,255,255,0.3)",
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    paddingBottom: 12,
                    cursor: "pointer",
                    transition: "color 0.12s",
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <div
              style={{
                padding: "20px 32px",
                borderBottom: "1px solid rgba(212,175,55,0.05)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(212,175,55,0.9)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Active Applications
              </span>
              <span
                style={{
                  fontSize: 9,
                  color: "rgba(212,175,55,0.4)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Total: {filtered.length}
              </span>
            </div>
            <div className="row">
              {["", "COMPANY", "ROLE", "STATUS", "DATE", ""].map((h, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 7,
                    letterSpacing: "0.2em",
                    color: "rgba(255,255,255,0.2)",
                    fontWeight: 600,
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
            {isLoading ? (
              <div
                style={{
                  padding: "48px 32px",
                  textAlign: "center",
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  color: "rgba(255,255,255,0.1)",
                }}
              >
                LOADING...
              </div>
            ) : (
              <ApplicationTable
                applications={filtered}
                STATUS_CONFIG={STATUS_CONFIG}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Pipeline breakdown */}
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid rgba(212,175,55,0.05)",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(212,175,55,0.9)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Pipeline
              </span>
            </div>
            <div
              style={{
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const count = counts[key] || 0;
                const pct = applications.length
                  ? Math.round((count / applications.length) * 100)
                  : 0;
                return (
                  <div key={key}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.16em",
                          color: "rgba(255,255,255,0.3)",
                          textTransform: "uppercase",
                        }}
                      >
                        {cfg.label}
                      </span>
                      <span
                        style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}
                      >
                        {count}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 2,
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: cfg.color,
                          borderRadius: 4,
                          transition: "width 0.7s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick stats */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(212,175,55,0.9)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              Quick Stats
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                {
                  label: "Response Rate",
                  value: applications.length
                    ? `${Math.round(((counts.interviewing || 0) / applications.length) * 100)}%`
                    : "0%",
                },
                {
                  label: "Offer Rate",
                  value: applications.length
                    ? `${Math.round(((counts.offered || 0) / applications.length) * 100)}%`
                    : "0%",
                },
                {
                  label: "Active Pipeline",
                  value: (counts.applied || 0) + (counts.interviewing || 0),
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span
                    style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}
                  >
                    {s.label}
                  </span>
                  <span
                    style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}
                  >
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent — git-style activity feed */}
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid rgba(212,175,55,0.05)",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(212,175,55,0.9)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Recent
              </span>
            </div>
            <div
              style={{
                padding: "16px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 0,
              }}
            >
              {recentApplications.length === 0 ? (
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.16em",
                    color: "rgba(255,255,255,0.1)",
                    textTransform: "uppercase",
                    padding: "16px 0",
                  }}
                >
                  No entries yet
                </div>
              ) : (
                recentApplications.map((app, idx) => {
                  const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.draft;
                  const isLast = idx === recentApplications.length - 1;
                  return (
                    <div
                      key={app.id}
                      style={{
                        display: "flex",
                        gap: 12,
                        position: "relative",
                        paddingBottom: isLast ? 0 : 20,
                      }}
                    >
                      {!isLast && (
                        <div
                          style={{
                            position: "absolute",
                            left: 6,
                            top: 16,
                            bottom: 0,
                            width: 1,
                            background: "rgba(255,255,255,0.06)",
                          }}
                        />
                      )}
                      <div
                        style={{
                          width: 13,
                          height: 13,
                          borderRadius: "50%",
                          background: idx === 0 ? cfg.color : "transparent",
                          border: `1px solid ${cfg.color}`,
                          flexShrink: 0,
                          marginTop: 2,
                          boxShadow:
                            idx === 0 ? `0 0 6px ${cfg.color}60` : "none",
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 500,
                              color: "rgba(255,255,255,0.8)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {app.company_name}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              color: "rgba(255,255,255,0.2)",
                              flexShrink: 0,
                            }}
                          >
                            {timeAgo(app.created_at)}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "rgba(255,255,255,0.35)",
                            marginTop: 2,
                          }}
                        >
                          {app.job_title}
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <span
                            style={{
                              fontSize: 7,
                              fontWeight: 700,
                              letterSpacing: "0.12em",
                              padding: "2px 6px",
                              borderRadius: 3,
                              background: `${cfg.color}18`,
                              color: cfg.color,
                              border: `1px solid ${cfg.color}30`,
                              textTransform: "uppercase",
                            }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ marginTop: 64, paddingBottom: 32, textAlign: "center" }}>
        <span
          style={{
            fontSize: 9,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(232,226,217,0.25)",
          }}
        >
          FSS 2026
        </span>
      </footer>

      {/* ── FORM MODAL ── */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div
            className="glass-card"
            style={{ padding: 40, width: 500, maxWidth: "95vw" }}
          >
            <div
              style={{
                fontSize: 8,
                letterSpacing: "0.22em",
                color: "rgba(255,255,255,0.2)",
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              New Entry
            </div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: "white",
                marginBottom: 32,
                marginTop: 0,
              }}
            >
              Log Application
            </h2>
            <div style={{ display: "grid", gap: 20 }}>
              {[
                {
                  label: "Company Name *",
                  key: "company_name",
                  placeholder: "e.g. Shopify",
                },
                {
                  label: "Job Title *",
                  key: "job_title",
                  placeholder: "e.g. Junior Developer",
                },
                {
                  label: "Job URL",
                  key: "job_url",
                  placeholder: "https://...",
                },
                {
                  label: "Date Applied",
                  key: "date_applied",
                  placeholder: "YYYY-MM-DD",
                },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 8,
                      letterSpacing: "0.18em",
                      color: "rgba(255,255,255,0.2)",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    {label}
                  </label>
                  <input
                    className="field"
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (key === "job_url" && val && !val.startsWith("http"))
                        val = "https://" + val;
                      setForm({ ...form, [key]: val });
                    }}
                  />
                </div>
              ))}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 8,
                    letterSpacing: "0.18em",
                    color: "rgba(255,255,255,0.2)",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Notes
                </label>
                <textarea
                  className="field"
                  rows={3}
                  placeholder="Recruiter, salary, interview prep..."
                  style={{ resize: "none" }}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 32 }}>
              <button
                className="glow-button"
                style={{ flex: 1 }}
                onClick={handleSubmit}
              >
                Save Application
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: "none",
                  border: "1px solid rgba(212,175,55,0.1)",
                  color: "rgba(255,255,255,0.3)",
                  borderRadius: 12,
                  padding: "10px 20px",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
