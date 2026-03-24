// React hooks we actually use:
// useState  — lets a component remember values between renders
// useMemo   — caches a calculated value so it doesn't recalculate on every render
// useEffect — runs code after the component mounts (good for fetching data)
import { useState, useMemo, useEffect } from "react";

// Bug icon from lucide-react, used in the bug report button at the bottom
import { Bug } from "lucide-react";

// These are the three functions that talk to our Express backend.
// All fetch calls live in api/applications.js — nothing in this file calls fetch directly.
import {
  createApplication,
  getApplications,
  deleteApplication,
} from "./api/applications";

// ApplicationTable handles rendering the rows. It lives in its own file
// because Justin's edit/delete slice wires into it separately.
import ApplicationTable from "./components/ApplicationTable";

// WebGL aurora background — uses the ogl library to render a shader animation.
// Lives in components/Aurora.jsx. Accepts colorStops, blend, amplitude, speed as props.
import Aurora from "./components/Aurora";

// All the CSS for this component — glass cards, buttons, row grid, field styles.
import "./App.css";

// GlassIcons is imported but currently not used in the JSX.
// The bug report button was refactored to a plain <button> instead.
// This import can be safely removed unless you plan to use GlassIcons elsewhere.
import GlassIcons from "./components/GlassIcons";

// Pre-built GitHub issue URL with the bug report template baked in.
// When clicked it opens a new issue on the FSS repo with the fields pre-filled.
// The %0A is a URL-encoded newline. %20 is a space.
const BUG_REPORT_URL =
  "https://github.com/FirstSipSolutions/job-application-tracker/issues/new?title=[BUG]%20&labels=bug&body=**Describe%20the%20bug**%0A%0A**Steps%20to%20reproduce**%0A1.%20%0A2.%20%0A3.%20%0A%0A**Expected%20behaviour**%0A%0A**Actual%20behaviour**%0A%0A**Browser%20%2F%20Device**";

// DEAD CODE — this div is floating outside the component and does nothing.
// It never renders. It was leftover from when GlassIcons was being wired up.
// Delete lines 18-25 entirely.
<div
  style={{
    position: "fixed",
    bottom: 32,
    right: 32,
    zIndex: 50,
  }}
></div>;

// STATUS_CONFIG is the single source of truth for how statuses look across the app.
// The key matches what's stored in the DB (lowercase ENUM value).
// label = what shows in the UI badge
// color = used for the badge background, text, border, and aurora background
// If you add a new status to the DB ENUM, add it here too or the badge will break.
const STATUS_CONFIG = {
  draft: { label: "DRAFT", color: "#9e9e9e" },
  applied: { label: "APPLIED", color: "#5b9bd5" },
  interviewing: { label: "INTERVIEWING", color: "#e0a84b" },
  offered: { label: "OFFERED", color: "#4cad7c" },
  rejected: { label: "REJECTED", color: "#d96b6b" },
  withdrawn: { label: "WITHDRAWN", color: "#a0a0b0" },
};

// NAV_ITEMS drives the filter tabs at the top of the table.
// "ALL" is a special case — it shows everything and doesn't match a DB status.
// The rest map directly to STATUS_CONFIG keys uppercased.
// If you add FOLLOWUP as a status later, add it here too.
const NAV_ITEMS = [
  "ALL",
  "APPLIED",
  "INTERVIEWING",
  "OFFERED",
  "REJECTED",
  "DRAFT",
];

// Converts a timestamp into a human-readable relative string.
// Used in the Recent activity sidebar to show "2h ago" or "3d ago".
// Falls back to "—" if no date is provided.
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
  // Which filter tab is selected. Defaults to ALL so everything shows on load.
  const [activeFilter, setActiveFilter] = useState("ALL");

  // Controls whether the Log Application modal is visible.
  // true = open, false = closed.
  const [showForm, setShowForm] = useState(false);

  // The live array of applications pulled from the DB.
  // Starts empty — useEffect below populates it on mount.
  const [applications, setApplications] = useState([]);

  // Used to show a LOADING... message while the first DB fetch is in flight.
  const [isLoading, setIsLoading] = useState(true);

  // Controlled form state — every field in the Log Application modal.
  // Each key maps to a column in the applications table.
  // When the user types, onChange updates the matching key here.
  const [form, setForm] = useState({
    company_name: "",
    job_title: "",
    job_url: "",
    date_applied: "",
    notes: "",
  });

  // Runs once when the component first mounts (the empty [] dependency array means
  // "only run this once, not on every re-render").
  // Calls getApplications() which hits GET /api/applications on the backend.
  // When the data comes back it sets state, which triggers a re-render and fills the table.
  // .finally() turns off the loading spinner regardless of whether it succeeded or failed.
  useEffect(() => {
    getApplications()
      .then((data) => setApplications(data))
      .finally(() => setIsLoading(false));
  }, []);

  // Fires when the user clicks Save Application in the modal.
  // Guards against empty required fields before sending anything to the backend.
  // After a successful POST, prepends the new row to the top of the table
  // (newest first, same order as the DB query), resets the form, and closes the modal.
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

  // Fires when the user clicks the trash icon on a row.
  // window.confirm gives a native browser dialog with the company name
  // so the user has to consciously confirm — prevents accidental deletes.
  // After a successful DELETE it removes the row from local state immediately
  // without needing to re-fetch from the DB.
  const handleDelete = async (id) => {
    const app = applications.find((a) => a.id === id);
    if (
      !window.confirm(
        `Delete application for ${app.company_name}? This can't be undone.`,
      )
    )
      return;
    await deleteApplication(id);
    setApplications(applications.filter((a) => a.id !== id));
  };

  // Search bar was removed to clean up the UI.
  // filtered now just applies the active nav filter tab.
  // useMemo caches the result so it only recalculates when applications
  // or activeFilter actually changes — not on every render.
  const filtered = useMemo(() => {
    return activeFilter === "ALL"
      ? applications
      : applications.filter((a) => a.status.toUpperCase() === activeFilter);
  }, [applications, activeFilter]);

  // counts builds an object like { draft: 2, applied: 5, interviewing: 1, ... }
  // used by the stat cards and the pipeline breakdown in the right sidebar.
  // Object.fromEntries turns an array of [key, value] pairs back into an object.
  const counts = Object.fromEntries(
    Object.keys(STATUS_CONFIG).map((s) => [
      s,
      applications.filter((a) => a.status === s).length,
    ]),
  );

  // Counts applications created in the current calendar month.
  // created_at comes back from Postgres as a full timestamp string.
  // We convert it to a Date object and compare month + year to today.
  const thisMonth = applications.filter((a) => {
    if (!a.created_at) return false;
    const d = new Date(a.created_at);
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;

  // The 5 most recent applications for the Recent sidebar.
  // The DB already returns rows newest first so slice(0, 5) gives us the top 5.
  const recentApplications = applications.slice(0, 5);

  // Each nav filter has its own aurora color palette.
  // The colors are passed to Aurora as colorStops and lerp toward the target
  // each frame — this creates the slow transition when you click a filter tab.
  // Three hex values = three color stops across the shader gradient.
  const AURORA_COLORS = {
    ALL: ["#0a2a3a", "#0d6e8a", "#1a3a4a"],
    APPLIED: ["#1a0a3a", "#7b2fff", "#0a0a2a"],
    INTERVIEWING: ["#3a2a0d", "#6b4a1a", "#4a3a0d"],
    OFFERED: ["#0d3a1a", "#1a6b2a", "#0d2a14"],
    REJECTED: ["#3a0d0d", "#6b1a1a", "#2a0d0d"],
    DRAFT: ["#1a1a2e", "#2a2a4a", "#0d0d1e"],
    WITHDRAWN: ["#1a1a1a", "#2a2a2a", "#0d0d0d"],
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 16px" }}>
      {/* Aurora is a fixed fullscreen WebGL canvas that sits behind everything.
          It reads colorStops from AURORA_COLORS[activeFilter] so the background
          changes color when the user clicks a filter tab.
          pointer-events: none in Aurora.css prevents it from blocking clicks/scroll. */}
      <Aurora
        colorStops={AURORA_COLORS[activeFilter]}
        blend={0.4}
        amplitude={1.2}
        speed={0.5}
      />

      {/* ── HEADER ── */}
      {/* clamp(18px, 4vw, 28px) means the font scales with viewport width
          but never goes below 18px or above 28px. */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <h1
          style={{
            fontSize: "clamp(18px, 4vw, 28px)",
            fontWeight: 300,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "#e8e2d9",
            margin: 0,
          }}
        >
          APPLICATION{" "}
          {/* The {" "} before TRACKER adds a space between the two words
              because JSX strips whitespace between adjacent elements. */}
          <span style={{ color: "#c9a96e", fontWeight: 500 }}>TRACKER</span>
        </h1>
        {/* Opens the Log Application modal */}
        <button className="glow-button" onClick={() => setShowForm(true)}>
          + Log
        </button>
      </header>

      {/* ── MAIN GRID ──
          Two columns: left takes all remaining space (1fr), right is fixed 300px.
          main-layout class in App.css collapses this to single column on mobile. */}
      <div
        className="main-layout"
        style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}
      >
        {/* ── LEFT COLUMN ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            minWidth: 0, // prevents flex children from overflowing their container
          }}
        >
          {/* ── STAT CARDS ──
              Array of objects mapped to glass cards. Each card shows a label,
              a big number, and a sub-label. All values come from live DB data.
              stats-grid class in App.css makes this 2 columns on tablet, 1 on mobile. */}
          <div
            className="stats-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
            }}
          >
            {[
              {
                label: "This Month",
                value: `+${thisMonth}`, // applications created this calendar month
                sub: "Applications",
              },
              {
                label: "Total",
                value: applications.length, // total rows in the DB for this device
                sub: "Life-time",
              },
              {
                label: "Interviews",
                value: counts.interviewing || 0, // rows with status = 'interviewing'
                sub: "Active Stage",
              },
              {
                label: "Offers",
                value: counts.offered || 0, // rows with status = 'offered'
                sub: "Received",
              },
            ].map((s) => (
              <div key={s.label} className="glass-card" style={{ padding: 16 }}>
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.18em",
                    color: "rgba(201,169,110,0.5)",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 300,
                    color: "#e8e2d9",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(232,226,217,0.3)",
                    marginTop: 4,
                  }}
                >
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* ── FILTER TABS ──
              Maps NAV_ITEMS to buttons. Clicking a button sets activeFilter state
              which updates the filtered array and changes the aurora color.
              overflowX: auto lets the tabs scroll horizontally on small screens
              instead of wrapping or overflowing. */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "flex",
                gap: 16,
                borderBottom: "1px solid rgba(201,169,110,0.05)",
                overflowX: "auto",
              }}
            >
              {NAV_ITEMS.map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveFilter(item)}
                  style={{
                    background: "none",
                    border: "none",
                    // active tab gets an underline, inactive tabs are dimmed
                    borderBottom:
                      activeFilter === item
                        ? "1px solid #e8e2d9"
                        : "1px solid transparent",
                    color:
                      activeFilter === item
                        ? "#e8e2d9"
                        : "rgba(232,226,217,0.3)",
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    paddingBottom: 10,
                    cursor: "pointer",
                    transition: "color 0.18s",
                    whiteSpace: "nowrap", // stops tab text from wrapping
                    flexShrink: 0, // stops tabs from shrinking when space is tight
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* ── APPLICATIONS TABLE ──
              The glass card is just the wrapper. ApplicationTable handles
              rendering the actual rows and the empty state.
              table-scroll class in App.css adds horizontal scroll on mobile
              so the columns don't get crushed. */}
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(201,169,110,0.05)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(201,169,110,0.9)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Applications
              </span>
              {/* Shows the count of filtered rows, not the total */}
              <span
                style={{
                  fontSize: 9,
                  color: "rgba(201,169,110,0.4)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Total: {filtered.length}
              </span>
            </div>
            <div className="table-scroll">
              {/* Column headers — must match the grid-template-columns in .row CSS */}
              <div className="row">
                {["", "COMPANY", "ROLE", "STATUS", "DATE", ""].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 7,
                      letterSpacing: "0.2em",
                      color: "rgba(232,226,217,0.2)",
                      fontWeight: 600,
                    }}
                  >
                    {h}
                  </div>
                ))}
              </div>
              {/* Show loading state while the first fetch is in flight.
                  Once isLoading flips to false, render the table. */}
              {isLoading ? (
                <div
                  style={{
                    padding: "48px 20px",
                    textAlign: "center",
                    fontSize: 9,
                    letterSpacing: "0.2em",
                    color: "rgba(232,226,217,0.1)",
                  }}
                >
                  LOADING...
                </div>
              ) : (
                // Pass filtered (not applications) so the active tab filter applies.
                // onDelete wires the trash icon back up to handleDelete here.
                // STATUS_CONFIG is passed so ApplicationTable can look up colors.
                <ApplicationTable
                  applications={filtered}
                  STATUS_CONFIG={STATUS_CONFIG}
                  onDelete={handleDelete}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ──
            right-col class in App.css hides this entire column on mobile. */}
        <div
          className="right-col"
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          {/* ── PIPELINE BREAKDOWN ──
              Shows a progress bar for each status based on what percentage
              of total applications have that status.
              pct will be 0 if applications.length is 0 to avoid dividing by zero. */}
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(201,169,110,0.05)",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(201,169,110,0.9)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Overview
              </span>
            </div>
            <div
              style={{
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const count = counts[key] || 0;
                // percentage of total applications with this status
                const pct = applications.length
                  ? Math.round((count / applications.length) * 100)
                  : 0;
                return (
                  <div key={key}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 5,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.16em",
                          color: "rgba(232,226,217,0.3)",
                          textTransform: "uppercase",
                        }}
                      >
                        {cfg.label}
                      </span>
                      <span
                        style={{ fontSize: 9, color: "rgba(232,226,217,0.3)" }}
                      >
                        {count}
                      </span>
                    </div>
                    {/* Track is a fixed height div, the inner div width is the percentage */}
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
                          transition: "width 0.7s ease", // animates when counts change
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── QUICK STATS ──
              Three derived metrics calculated from the live applications array.
              Response Rate = how many applied turned into interviews.
              Offer Rate = how many total turned into offers.
              Active leads = applied + interviewing combined (balls in the air). */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(201,169,110,0.9)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Quick Stats
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                {
                  label: "Response Rate",
                  // interviewing / total as a percentage
                  value: applications.length
                    ? `${Math.round(((counts.interviewing || 0) / applications.length) * 100)}%`
                    : "0%",
                },
                {
                  label: "Offer Rate",
                  // offered / total as a percentage
                  value: applications.length
                    ? `${Math.round(((counts.offered || 0) / applications.length) * 100)}%`
                    : "0%",
                },
                {
                  label: "Active Leads",
                  // everything still in play — not draft, not finished
                  value: (counts.applied || 0) + (counts.interviewing || 0),
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span
                    style={{ fontSize: 11, color: "rgba(232,226,217,0.4)" }}
                  >
                    {s.label}
                  </span>
                  <span
                    style={{ fontSize: 11, color: "rgba(232,226,217,0.7)" }}
                  >
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RECENT ACTIVITY ──
              Shows the 5 most recent applications as a git-style timeline.
              The first item gets a solid colored dot with a glow,
              the rest get outlined dots. A vertical line connects them.
              timeAgo converts the created_at timestamp to "2h ago" etc. */}
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(201,169,110,0.05)",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(201,169,110,0.9)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Recent
              </span>
            </div>
            <div
              style={{
                padding: "14px 20px",
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
                    color: "rgba(232,226,217,0.1)",
                    textTransform: "uppercase",
                    padding: "12px 0",
                  }}
                >
                  No entries yet
                </div>
              ) : (
                recentApplications.map((app, idx) => {
                  // Look up the status config for this row's badge color.
                  // Falls back to draft if the status isn't in STATUS_CONFIG.
                  const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.draft;
                  const isLast = idx === recentApplications.length - 1;
                  return (
                    <div
                      key={app.id}
                      style={{
                        display: "flex",
                        gap: 10,
                        position: "relative",
                        paddingBottom: isLast ? 0 : 18, // no bottom padding on last item
                      }}
                    >
                      {/* Vertical timeline line — only renders between items, not after the last */}
                      {!isLast && (
                        <div
                          style={{
                            position: "absolute",
                            left: 6,
                            top: 14,
                            bottom: 0,
                            width: 1,
                            background: "rgba(255,255,255,0.06)",
                          }}
                        />
                      )}
                      {/* Timeline dot — solid with glow for the newest entry, outlined for the rest */}
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
                            gap: 6,
                          }}
                        >
                          {/* Company name truncates with ellipsis if too long */}
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 500,
                              color: "rgba(232,226,217,0.8)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {app.company_name}
                          </span>
                          {/* Time since created — "2h ago", "3d ago" etc */}
                          <span
                            style={{
                              fontSize: 9,
                              color: "rgba(232,226,217,0.2)",
                              flexShrink: 0,
                            }}
                          >
                            {timeAgo(app.created_at)}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "rgba(232,226,217,0.35)",
                            marginTop: 2,
                          }}
                        >
                          {app.job_title}
                        </div>
                        {/* Status badge — background and border use the status color
                            with hex opacity suffixes: 18 = ~10% opacity, 30 = ~19% */}
                        <div style={{ marginTop: 3 }}>
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

      {/* ── BUG REPORT BUTTON ──
          Fixed to the bottom right corner. Transparent until hovered.
          The onMouseEnter/Leave directly mutate the style on the DOM element
          instead of using state — this is fine for simple hover effects.
          Opens BUG_REPORT_URL in a new tab when clicked.
          GlassIcons is no longer used here — the import at the top can be removed. */}
      <button
        onClick={() => window.open(BUG_REPORT_URL, "_blank")}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(232,226,217,0.25)",
          fontSize: 10,
          letterSpacing: "0.1em",
          transition: "color 0.2s",
          padding: 0,
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "rgba(232,226,217,0.7)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "rgba(232,226,217,0.25)")
        }
      >
        <Bug size={13} />
        Found a bug? Report it here
      </button>

      {/* ── FOOTER ── */}
      <footer style={{ marginTop: 48, paddingBottom: 24, textAlign: "center" }}>
        <span
          style={{
            fontSize: 9,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(232,226,217,0.15)",
          }}
        >
          © 2026 First Sip Solutions
        </span>
      </footer>

      {/* ── FORM MODAL ──
          Only renders when showForm is true.
          The overlay div covers the whole screen. Clicking the overlay background
          (not the panel itself) closes the modal — e.target === e.currentTarget
          checks that the click was on the overlay, not a child element inside it.
          backdrop-filter: blur(8px) blurs what's behind the overlay.
          rgba(0,0,0,0.6) at 60% opacity lets the aurora show through slightly. */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100, // higher than the bug button at 50
            padding: 16,
          }}
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div
            className="glass-card"
            style={{ padding: 32, width: "100%", maxWidth: 500 }}
          >
            <div
              style={{
                fontSize: 8,
                letterSpacing: "0.22em",
                color: "rgba(232,226,217,0.2)",
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              New Entry
            </div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#e8e2d9",
                marginBottom: 28,
                marginTop: 0,
              }}
            >
              Log Application
            </h2>

            {/* Form fields mapped from an array so adding a new field
                is just adding a new object to this array.
                Each input is a controlled component — value reads from form state,
                onChange writes back to it using the spread operator to keep
                all other fields intact when one changes.
                job_url gets auto-prefixed with https:// if the user types
                a bare URL without a protocol. */}
            <div style={{ display: "grid", gap: 18 }}>
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
                      color: "rgba(232,226,217,0.2)",
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
                      // auto-prefix https:// so Zod's URL validation doesn't reject
                      // bare URLs like "linkedin.com/jobs/123"
                      if (key === "job_url" && val && !val.startsWith("http"))
                        val = "https://" + val;
                      setForm({ ...form, [key]: val });
                    }}
                  />
                </div>
              ))}

              {/* Notes is separate because it uses a textarea not an input */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 8,
                    letterSpacing: "0.18em",
                    color: "rgba(232,226,217,0.2)",
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
                  style={{ resize: "none" }} // prevents the textarea from being dragged to resize
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
              {/* Save fires handleSubmit which validates, POSTs, and closes the modal */}
              <button
                className="glow-button"
                style={{ flex: 1 }}
                onClick={handleSubmit}
              >
                Save Application
              </button>
              {/* Cancel just closes the modal without saving */}
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: "none",
                  border: "1px solid rgba(201,169,110,0.1)",
                  color: "rgba(232,226,217,0.3)",
                  borderRadius: 10,
                  padding: "10px 16px",
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
