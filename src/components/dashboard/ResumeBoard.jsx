import { useRef, useState } from "react";
import { Download, ExternalLink, FileText } from "lucide-react";
import { useResumes } from "../../hooks/useResumes.js";
import ResumeDetailModal from "../modals/ResumeDetailModal.jsx";

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getBadge(resume, allResumes) {
  const { count } = resume._stats;
  const daysSince = (Date.now() - new Date(resume.created_at)) / 864e5;
  const maxUsed   = Math.max(...allResumes.map(r => r._stats.count), 0);
  if (count === 0 && daysSince < 7)   return { label: "New",       color: "#5ba3ff" };
  if (count === 0 && daysSince > 30)  return { label: "Resting",   color: "#888"    };
  if (count === maxUsed && count > 0) return { label: "Most Used", color: "#abc4ff" };
  if (count >= 5)                     return { label: "Active",    color: "#4cad7c" };
  return null;
}

function GhostCard({ app, onClick }) {
  const preview = app.cover_letter?.slice(0, 100).replace(/\n+/g, " ") ?? "";
  return (
    <div className="rb-card rb-card-ghost" onClick={() => onClick(app)} style={{ cursor: "pointer" }}>
      <div className="rb-ghost-tag">1-off</div>
      <div className="rb-card-top">
        <span className="rb-name rb-ghost-name">{app.company}</span>
      </div>
      <div className="rb-date">{app.role}</div>
      <div className="rb-date" style={{ marginTop: 2 }}>{fmtDate(app.date)}</div>
      {preview && <p className="rb-ghost-preview">{preview}{app.cover_letter.length > 100 ? "..." : ""}</p>}
    </div>
  );
}

function GhostModal({ app, onClose }) {
  return (
    <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <span className="modal-title">{app.company} — {app.role}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ padding: "4px 0 8px", fontSize: 11, color: "var(--text-faint)" }}>{fmtDate(app.date)} · 1-off cover letter</div>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.7, color: "var(--text)", maxHeight: 420, overflowY: "auto", fontFamily: "inherit" }}>
          {app.cover_letter}
        </pre>
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function ResumeBoard({ apps = [] }) {
  const { resumes, uploading, uploadResume, renameResume, removeResume, getUrl } = useResumes();
  const [editing,    setEditing]    = useState(null);
  const [editVal,    setEditVal]    = useState("");
  const [viewResume, setViewResume] = useState(null);
  const [viewGhost,  setViewGhost]  = useState(null);
  const resumeInput = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (file) uploadResume(file, "resume");
    e.target.value = "";
  }

  function startRename(r) { setEditing(r.id); setEditVal(r.name); }
  function commitRename() { if (editVal.trim()) renameResume(editing, editVal.trim()); setEditing(null); }

  const textLetters = apps.filter(a => a.cover_letter);
  const cvCount     = resumes.length;
  const clCount     = textLetters.length;

  return (
    <>
    <div className="db-card db-resume-board">
      <div className="rb-header">
        <div>
          <div className="db-card-title">CV Vault</div>
          <div className="db-card-sub">
            {cvCount} resume{cvCount !== 1 ? "s" : ""}
            {clCount > 0 && ` · ${clCount} cover letter${clCount !== 1 ? "s" : ""}`}
          </div>
        </div>
        <div className="rb-upload-row">
          <input ref={resumeInput} type="file" accept=".pdf" style={{ display: "none" }} onChange={handleFile} />
          <button className="rb-upload-btn" disabled={uploading} onClick={() => resumeInput.current.click()}>
            + Resume
          </button>
        </div>
      </div>

      {cvCount === 0 && clCount === 0 ? (
        <p className="db-app-empty">Upload tailored resumes. Cover letters appear here automatically when you write one for a job.</p>
      ) : (
        <div className="rb-cards">
          {resumes.map(r => {
            const { count, responses } = r._stats;
            const rate  = count ? Math.round(responses / count * 100) : null;
            const badge = getBadge(r, resumes);
            return (
              <div key={r.id} className="rb-card" style={{ cursor: "pointer" }} onClick={() => setViewResume(r)}>
                <div className="rb-card-top">
                  {editing === r.id ? (
                    <div className="rb-rename-wrap">
                      <input
                        className="rb-rename"
                        value={editVal}
                        autoFocus
                        onChange={e => setEditVal(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditing(null); }}
                      />
                    </div>
                  ) : (
                    <span className="rb-name" onClick={e => { e.stopPropagation(); startRename(r); }} title="Click to rename">{r.name}</span>
                  )}
                  <div className="rb-actions" onClick={e => e.stopPropagation()}>
                    <button className="rb-icon-btn" title="Open" onClick={async () => { const url = await getUrl(r.file_path); if (url) window.open(url, "_blank"); }}>
                      <ExternalLink size={13} />
                    </button>
                    <button className="rb-icon-btn" title="Download" onClick={async () => { const url = await getUrl(r.file_path, `${r.name}.pdf`); if (url) { const a = document.createElement("a"); a.href = url; a.click(); } }}>
                      <Download size={13} />
                    </button>
                    <button className="rb-icon-btn rb-icon-del" onClick={() => removeResume(r.id)} title="Delete">×</button>
                  </div>
                </div>
                <div className="rb-date">{fmtDate(r.created_at)}</div>
                <div className="rb-stats">
                  <span className="rb-stat"><strong>{count}</strong> sent</span>
                  {rate !== null && <span className="rb-stat"><strong>{rate}%</strong> response</span>}
                </div>
                {badge && <span className="rb-badge" style={{ color: badge.color, borderColor: badge.color }}>{badge.label}</span>}
              </div>
            );
          })}

          {textLetters.map(a => (
            <GhostCard key={`cl-${a.id}`} app={a} onClick={setViewGhost} />
          ))}
        </div>
      )}
    </div>

    {viewResume && (
      <ResumeDetailModal resume={viewResume} onClose={() => setViewResume(null)} getUrl={getUrl} />
    )}
    {viewGhost && (
      <GhostModal app={viewGhost} onClose={() => setViewGhost(null)} />
    )}
    </>
  );
}
