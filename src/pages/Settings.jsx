import { useState } from "react";
import AppNav from "../components/layout/AppNav.jsx";
import { useProfile } from "../context/ProfileContext.jsx";
import { fetchGithubReadme, clearGithubCache } from "../lib/github.js";
import { parseGithubProfile } from "../lib/llm/parseProfile.js";
import "../styles/dashboard.css";

export default function Settings() {
  const { displayName, jobTitle, githubUsername, userProfile, updateProfile } = useProfile();

  const [name,   setName]   = useState(displayName);
  const [title,  setTitle]  = useState(jobTitle);
  const [github, setGithub] = useState(githubUsername);
  const [saved,  setSaved]  = useState(false);
  const [syncing,  setSyncing]  = useState(false);
  const [syncMsg,  setSyncMsg]  = useState(null);

  function handleSave(e) {
    e.preventDefault();
    updateProfile({ displayName: name.trim(), jobTitle: title.trim(), githubUsername: github.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleGithubSync() {
    const username = github.trim();
    if (!username) return;
    setSyncing(true);
    setSyncMsg(null);
    clearGithubCache(username);
    try {
      const readme = await fetchGithubReadme(username);
      if (!readme) {
        setSyncMsg("No profile README found. See setup guide below.");
        return;
      }
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      const profile = await parseGithubProfile(readme, apiKey);
      if (!profile) {
        setSyncMsg("Could not parse profile. Try updating your README.");
        return;
      }
      updateProfile({ githubUsername: username, userProfile: profile });
      setSyncMsg(`Synced — detected: ${profile.stack?.slice(0, 4).join(", ")}`);
    } finally {
      setSyncing(false);
    }
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

        <div className="db-card" style={{ maxWidth: 440, marginTop: 20 }}>
          <div className="db-card-title">GitHub Profile</div>
          <div className="db-card-sub">
            Used for job match scoring — no resume upload needed
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="settings-input" type="text" placeholder="GitHub username"
                value={github} onChange={(e) => setGithub(e.target.value)}
                style={{ flex: 1 }} />
              <button className="db-nav-add" onClick={handleGithubSync} disabled={syncing || !github.trim()}>
                {syncing ? "Syncing…" : "Sync"}
              </button>
            </div>

            {syncMsg && (
              <p style={{ fontSize: 13, color: syncMsg.startsWith("Synced") ? "var(--accent)" : "var(--text-muted)", margin: 0 }}>
                {syncMsg}
              </p>
            )}

            {userProfile && (
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                <strong style={{ color: "var(--text)" }}>Active profile</strong><br />
                {userProfile.summary}<br />
                <span style={{ opacity: 0.7 }}>Stack: {userProfile.stack?.join(", ")}</span>
              </div>
            )}

            {!userProfile && (
              <details style={{ fontSize: 12, color: "var(--text-muted)" }}>
                <summary style={{ cursor: "pointer" }}>Setup guide — create a GitHub profile README</summary>
                <pre style={{ marginTop: 8, whiteSpace: "pre-wrap", fontSize: 11, opacity: 0.8 }}>{`1. Create a repo named exactly your GitHub username
2. Add a README.md with a section like:

## Job Search Profile
Role: Full Stack Developer
Experience: 4+ years
Level: Mid to Senior
Work: Remote only
Location: Canada — open to Canadian and global teams
Stack: React, TypeScript, Node.js, PostgreSQL

3. Click Sync above`}</pre>
              </details>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
