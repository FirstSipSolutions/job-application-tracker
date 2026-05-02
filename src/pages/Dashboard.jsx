import { useState, useEffect } from "react";
import AppNav from "../components/layout/AppNav.jsx";
import AddApplicationModal from "../components/modals/AddApplicationModal.jsx";
import ProfileCard from "../components/dashboard/ProfileCard.jsx";
import PipelineCard from "../components/dashboard/PipelineCard.jsx";
import ApplicationsCard from "../components/dashboard/ApplicationsCard.jsx";
import UrgentPanel from "../components/widgets/UrgentPanel.jsx";
import WidgetGrid from "../components/widgets/WidgetGrid.jsx";
import { useApplications } from "../hooks/useApplications.js";
import "../styles/dashboard.css";

export default function Dashboard() {
  const { apps, loading, addApp, updateStatus, removeApp } = useApplications();
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
          <h1>Good morning</h1>
          <p>You have 2 upcoming interviews this week.</p>
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
