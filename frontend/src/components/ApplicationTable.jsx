export default function ApplicationTable({ applications, STATUS_CONFIG }) {
  if (applications.length === 0) {
    return (
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
    </>
  );
}
