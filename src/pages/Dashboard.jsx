import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AppNav from "../components/layout/AppNav.jsx";
import AddApplicationModal from "../components/modals/AddApplicationModal.jsx";
import ProfileCard from "../components/dashboard/ProfileCard.jsx";
import ActivityChart from "../components/dashboard/ActivityChart.jsx";
import JobApplicationBoard from "../components/dashboard/JobApplicationBoard.jsx";
import ResumeBoard from "../components/dashboard/ResumeBoard.jsx";
import CoverLetterStack from "../components/jobs/CoverLetterStack.jsx";
import UpcomingPanel from "../components/dashboard/UpcomingPanel.jsx";
import WidgetGrid from "../components/dashboard/WidgetGrid.jsx";
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
  // Read bookmarklet params at render time, useState ignores initial value after first render
  // so this is safe and avoids setState-in-effect lint errors.
  const [searchParams] = useSearchParams();
  const _fromBookmark  = searchParams.get("add") === "1";

  const [showModal,   setShowModal]   = useState(_fromBookmark);
  const [editingApp,  setEditingApp]  = useState(null);
  const [prefillData, setPrefillData] = useState(_fromBookmark ? {
    url:     searchParams.get("url")     || "",
    role:    searchParams.get("role")    || "",
    company: searchParams.get("company") || "",
  } : null);

  // Strip params from the URL after reading, no setState, just history cleanup.
  useEffect(() => {
    if (window.location.search.includes("add=1")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

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
              <div className="db-sidebar-title">New Today</div>
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

          <ResumeBoard />

          <div className="db-card db-cover-letters">
            <CoverLetterStack apps={apps} />
          </div>
        </div>
      </main>

      {showModal && (
        <AddApplicationModal
          onClose={() => { setShowModal(false); setPrefillData(null); }}
          onAdd={addApp}
          prefill={prefillData}
        />
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
