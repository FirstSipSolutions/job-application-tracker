import { useState } from "react";
import AppNav from "../components/layout/AppNav.jsx";
import { useProfile } from "../context/ProfileContext.jsx";
import "../styles/dashboard.css";

export default function Settings() {
  const { displayName, jobTitle, updateProfile } = useProfile();

  // local draft state so changes only apply on save, not live as you type
  const [name,  setName]  = useState(displayName);
  const [title, setTitle] = useState(jobTitle);
  const [saved, setSaved] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    updateProfile({ displayName: name.trim(), jobTitle: title.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="db-root">
      <AppNav />

      <main className="db-main">
        <div className="db-greeting">
          <h1>Settings</h1>
          <p>Changes here update your dashboard profile card instantly.</p>
        </div>

        <div className="db-card" style={{ maxWidth: 440 }}>
          <div className="db-card-title">Profile</div>
          <div className="db-card-sub">Shown on your dashboard</div>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
            <div>
              <label className="settings-label">Display Name</label>
              <input className="settings-input" type="text" placeholder="Your name"
                value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="settings-label">Job Title</label>
              <input className="settings-input" type="text" placeholder="e.g. Frontend Developer"
                value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <button type="submit" className="db-nav-add" style={{ alignSelf: "flex-start", marginTop: 4 }}>
              {saved ? "Saved" : "Save Changes"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
