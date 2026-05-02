import { useState, useEffect } from "react";
import AppNav from "../components/layout/AppNav.jsx";
import AddApplicationModal from "../components/modals/AddApplicationModal.jsx";
import ProfileCard from "../components/dashboard/ProfileCard.jsx";
import PipelineCard from "../components/dashboard/PipelineCard.jsx";
import ApplicationsCard from "../components/dashboard/ApplicationsCard.jsx";
import UrgentPanel from "../components/widgets/UrgentPanel.jsx";
import WidgetGrid from "../components/widgets/WidgetGrid.jsx";
import { useApplications } from "../hooks/useApplications.js";
import { useProfile } from "../context/ProfileContext.jsx";
import "../styles/dashboard.css";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { apps, loading, addApp, updateStatus, removeApp } = useApplications();
  const { displayName } = useProfile();
  const [showModal, setShowModal] = useState(false);

  // when user returns from a Hire Hub job board click, open Add Application
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible" && sessionStorage.getItem("job-hunt")) {
        sessionStorage.removeItem("job-hunt");
        setShowModal(true);
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return (
    <div className="db-root">
      <AppNav onAddApp={() => setShowModal(true)} />

      <main className="db-main">
        <div className="db-greeting">
          <h1>{greeting()}{displayName ? `, ${displayName}` : ""}</h1>
          <p>{apps.filter(a => a.status === "Interview").length} active interview{apps.filter(a => a.status === "Interview").length !== 1 ? "s" : ""} in your pipeline.</p>
        </div>

        <div className="db-bento">
          <ProfileCard />
          <PipelineCard />

          <div className="db-card db-sidebar">
            <div className="db-sidebar-section">
              <div className="db-sidebar-title">Urgent</div>
              <UrgentPanel />
            </div>
            <div className="db-sidebar-section">
              <div className="db-sidebar-title">Stats</div>
              <WidgetGrid apps={apps} vertical />
            </div>
          </div>

          <ApplicationsCard apps={apps} loading={loading} updateStatus={updateStatus} removeApp={removeApp} />
        </div>
      </main>

      {showModal && (
        <AddApplicationModal onClose={() => setShowModal(false)} onAdd={addApp} />
      )}
    </div>
  );
}
