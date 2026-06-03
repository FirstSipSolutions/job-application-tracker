import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      background: "var(--db-bg)",
      color: "var(--db-text)",
    }}>
      <span style={{ fontSize: 48, fontWeight: 700 }}>404</span>
      <p style={{ fontSize: 15, color: "var(--db-text-dim)", margin: 0 }}>That page does not exist.</p>
      <Link to="/" style={{ fontSize: 13, color: "var(--db-blue)" }}>Go home</Link>
    </div>
  );
}
