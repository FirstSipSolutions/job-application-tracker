import { Link } from "react-router-dom";

const STATUS_COLORS = {
  draft:     "#9e9e9e",
  outgoing:  "#5b9bd5",
  pending:   "#e0a84b",
  interview: "#c9a96e",
  offer:     "#4cad7c",
  rejected:  "#d96b6b",
};

export default function RoleCard({ role }) {
  const totalJobs = role.jobs?.length ?? 0;
  const statuses = Object.entries(role.statusCounts ?? {}).filter(([, n]) => n > 0);

  return (
    <Link to={`/app/role/${role.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <article
        style={cardStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#c9a96e";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(255, 235, 200, 0.08)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {/* top */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{role.title}</h3>
          <p style={{ fontSize: 11, color: "rgba(232,226,217,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {totalJobs} {totalJobs === 1 ? "job" : "jobs"}
          </p>
        </div>

        {/* status rows — fixed layout, no wrapping */}
        <div style={{ borderTop: "1px solid rgba(255,235,200,0.08)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          {statuses.slice(0, 4).map(([s, n]) => (
            <div key={s} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: STATUS_COLORS[s], textTransform: "capitalize" }}>{s}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(232,226,217,0.9)" }}>{n}</span>
            </div>
          ))}
          {statuses.length === 0 && (
            <p style={{ fontSize: 12, color: "rgba(232,226,217,0.25)" }}>No applications yet</p>
          )}
        </div>
      </article>
    </Link>
  );
}

const cardStyle = {
  width: "220px",
  height: "180px",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  cursor: "pointer",
  background: "rgba(20, 16, 12, 0.55)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 235, 200, 0.08)",
  color: "#e8e2d9",
  transition: "border-color 0.2s, transform 0.2s",
};
