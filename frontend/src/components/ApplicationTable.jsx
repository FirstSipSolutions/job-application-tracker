export default function ApplicationTable({ applications, STATUS_CONFIG, onDelete }) {
  if (applications.length === 0) {
    return (
      <div style={{ padding: "60px 32px", textAlign: "center", fontSize: 9, letterSpacing: "0.2em", color: "#1e1f28" }}>
        NO ENTRIES
      </div>
    );
  }

  return (
    <>
      {applications.map((app, i) => {
        const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG["draft"];
        return (
          <div key={app.id} className="row clickable">
            <div style={{ fontSize: 9, color: "#555566", fontWeight: 300 }}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, letterSpacing: "-0.01em", color: "#e8e4dc" }}>
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
              {app.date_applied
                ? new Date(app.date_applied).toLocaleDateString("en-CA")
                : "—"}
            </div>
            {/* Trash button — last column */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => onDelete(app.id)}
                title="Delete application"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8,
                  padding: "6px 8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(192,57,43,0.12)";
                  e.currentTarget.style.borderColor = "rgba(192,57,43,0.3)";
                  e.currentTarget.style.boxShadow = "0 0 12px rgba(192,57,43,0.15)";
                  e.currentTarget.querySelector("svg").style.stroke = "#c0392b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.querySelector("svg").style.stroke = "rgba(255,255,255,0.2)";
                }}
              >
                <svg
                  width="13"
                  height="14"
                  viewBox="0 0 13 14"
                  fill="none"
                  style={{ stroke: "rgba(255,255,255,0.2)", transition: "stroke 0.2s ease" }}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M1 3h11M4.5 3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M2 3l.8 9a1 1 0 0 0 1 .9h5.4a1 1 0 0 0 1-.9L11 3" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5.5 6v4M7.5 6v4" strokeWidth="1.1" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}