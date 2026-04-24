import { Link } from "react-router-dom";

// this can change but should be at the top of the card

const STATUS_COLORS = {
  saved: "#9e9e9e",
  applied: "#5b9bd5",
  interview: "#e0a84b",
  offer: "#4cad7c",
};

// 3. THE COMPONENT — PascalCase name matches filename, props destructured in the signature
export default function RoleCard({ role, onClick }) {
  // 3a. HOOKS first (useState, useEffect, useMemo) — none here yet
  // 3b. DERIVED VALUES — computed from props/state
  const totalJobs = role.jobs?.length ?? 0;

  // 3c. EVENT HANDLERS
  const handleClick = () => {
    onClick?.(role.id);
  };

  // 3d. RETURN — the JSX
  return (
    <article onClick={handleClick} style={cardStyle}>
      <h3>{role.title}</h3>
      <p>{totalJobs} jobs</p>
    </article>
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

