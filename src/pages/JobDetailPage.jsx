import { useParams } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout.jsx";

const JOB_NAV = ["Overview", "Notes", "Contacts", "Timeline"];

export default function JobDetailPage() {
  const { roleId, jobId } = useParams();

  const leftNav = (
    <>
      <p className="nav-section-label">Job</p>
      {JOB_NAV.map((item) => (
        <div key={item} className={`nav-item${item === "Overview" ? " active" : ""}`}>
          {item}
        </div>
      ))}
    </>
  );

  return (
    <AppLayout
      leftNav={leftNav}
      breadcrumb={
        <>
          <a href="/app" style={{ color: "var(--text-dim)" }}>Roles</a>
          <span className="al-topbar-sep">/</span>
          <a href={`/app/role/${roleId}`} style={{ color: "var(--text-dim)" }}>Role {roleId}</a>
          <span className="al-topbar-sep">/</span>
          <span style={{ color: "var(--text)" }}>Job {jobId}</span>
        </>
      }
    >
      <div style={{ padding: 32, color: "var(--text-dim)" }}>Job detail content goes here</div>
    </AppLayout>
  );
}
