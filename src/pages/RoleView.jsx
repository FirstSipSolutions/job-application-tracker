import { useParams } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout.jsx";

export default function RoleView() {
  const { roleId } = useParams();

  return (
    <AppLayout
      breadcrumb={
        <>
          <a href="/app" style={{ color: "var(--text-dim)" }}>Active Roles</a>
          <span className="al-topbar-sep">/</span>
          <span style={{ color: "var(--text)" }}>Role {roleId}</span>
        </>
      }
      rightPanel={<div style={{ padding: 20 }} />}
    >
      <div style={{ padding: 32 }} />
    </AppLayout>
  );
}
