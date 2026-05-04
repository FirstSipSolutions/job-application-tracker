import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Download, ExternalLink } from "lucide-react";
import { useResumes } from "../../hooks/useResumes.js";
import ResumeDetailModal from "../modals/ResumeDetailModal.jsx";

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Badge logic uses pre-aggregated _stats from the hook — no app array needed here.
// Badges reflect usage and activity, not callback rate, because no-callbacks are
// normal in a tough market and should not be framed as resume failure.
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

// No apps prop — stats come from the hook so this component never touches the
// full application list, which can grow to hundreds of rows.
export default function ResumeBoard() {
  const { resumes, uploading, uploadResume, renameResume, removeResume, getUrl } = useResumes();
  const [editing,     setEditing]     = useState(null);
  const [editVal,     setEditVal]     = useState("");
  const [viewResume,  setViewResume]  = useState(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept:   { "application/pdf": [".pdf"] },
    multiple: false,
    disabled: uploading,
    onDrop:   ([file]) => file && uploadResume(file),
  });

  function startRename(r) { setEditing(r.id); setEditVal(r.name); }
  function commitRename() { if (editVal.trim()) renameResume(editing, editVal.trim()); setEditing(null); }

  return (
    <>
    <div className="db-card db-resume-board">
      <div className="rb-header">
        <div>
          <div className="db-card-title">CV Vault</div>
          <div className="db-card-sub">{resumes.length} tailored version{resumes.length !== 1 ? "s" : ""}</div>
        </div>
        <div className={`rb-drop${isDragActive ? " rb-drop-active" : ""}`} {...getRootProps()}>
          <input {...getInputProps()} />
          {uploading ? "Uploading..." : isDragActive ? "Drop it" : "+ Upload Resume"}
        </div>
      </div>

      {resumes.length === 0 ? (
        <p className="db-app-empty">Store tailored resumes for specific roles and clients. Each version stays linked to the applications it was sent with so you always know what went where.</p>
      ) : (
        <div className="rb-cards">
          {resumes.map(r => {
            // Stats are pre-computed in the hook — just read them off the object.
            const { count, responses } = r._stats;
            // Response rate is shown as context only — low numbers are expected
            // in this market and do not indicate a problem with the resume.
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

                {badge && (
                  <span className="rb-badge" style={{ color: badge.color, borderColor: badge.color }}>
                    {badge.label}
                  </span>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>

    {viewResume && (
      <ResumeDetailModal
        resume={viewResume}
        onClose={() => setViewResume(null)}
        getUrl={getUrl}
      />
    )}
    </>
  );
}
