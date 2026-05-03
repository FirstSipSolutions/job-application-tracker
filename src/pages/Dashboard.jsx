import { useState, useEffect } from "react";
import AppNav from "../components/layout/AppNav.jsx";
import AddApplicationModal from "../components/modals/AddApplicationModal.jsx";
import ProfileCard from "../components/dashboard/ProfileCard.jsx";
import ActivityChart from "../components/dashboard/ActivityChart.jsx";
import JobApplicationBoard from "../components/dashboard/JobApplicationBoard.jsx";
import UpcomingPanel from "../components/widgets/UpcomingPanel.jsx";
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
  const { apps, loading, addApp, updateApp, updateStatus, removeApp } = useApplications();
  const { displayName } = useProfile();
  const [showModal, setShowModal]   = useState(false);
  const [editingApp, setEditingApp] = useState(null);

  // HireHub sets a sessionStorage flag before opening a job board; catches tab-return
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
          <ActivityChart apps={apps} />

          <div className="db-card db-sidebar">
            <div className="db-sidebar-section">
              <div className="db-sidebar-title">Upcoming</div>
              <UpcomingPanel />
            </div>
            <div className="db-sidebar-section">
              <div className="db-sidebar-title">Stats</div>
              <WidgetGrid apps={apps} vertical />
            </div>
          </div>

          <JobApplicationBoard
            apps={apps}
            loading={loading}
            updateStatus={updateStatus}
            removeApp={removeApp}
            onEdit={setEditingApp}
          />
        </div>
      </main>

      {showModal && (
        <AddApplicationModal onClose={() => setShowModal(false)} onAdd={addApp} />
      )}
      {editingApp && (
        <AddApplicationModal
          initial={editingApp}
          onClose={() => setEditingApp(null)}
          onAdd={(fields) => updateApp(editingApp.id, fields)}
        />
      )}
    </div>
  );
}
