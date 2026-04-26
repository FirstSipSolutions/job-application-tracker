import { Link } from "react-router-dom";

// this can change but should be at the top of the card

const STATUS_COLORS = {
  draft: "#9e9e9e", // grey
  outgoing: "#5b9bd5", // blue
  pending: "#e0a84b", // amber
  interview: "#c9a96e", // copper
  offer: "#4cad7c", // green
  rejected: "#d96b6b", // red
};

// 3. THE COMPONENT — PascalCase name matches filename, props destructured in the signature
export default function RoleCard({ role, onClick }) {
  // 3a. HOOKS first (useState, useEffect, useMemo) — none here yet
  // 3b. DERIVED VALUES — computed from props/state
  const totalJobs = role.jobs?.length ?? 0;



  // RETURN feedback after hovering

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
      <h3>{role.title}</h3>
      <p>{totalJobs} jobs</p>
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        {Object.entries(role.statusCounts ?? {}).map(([s, n]) => (
          <span
            key={s}
            style={{
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: STATUS_COLORS[s],
              opacity: n ? 1 : 0.3,
            }}
          >
            {n} {s}
          </span>
        ))}
      </div>
    </article>
    </Link>
  );
}

// here are all the styling params for the card itsself

const cardStyle = {
  width: "240px",
  padding: 24,
  borderRadius: 4,
  cursor: "pointer",
  background: "rgba(20, 16, 12, 0.55)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 235, 200, 0.08)",
  color: "#e8e2d9",
};
