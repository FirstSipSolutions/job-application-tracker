import { useRef, useState } from "react";
import { Download, ExternalLink } from "lucide-react";
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

export default function ResumeBoard() {
  const { resumes, uploading, uploadResume, renameResume, removeResume, getUrl } = useResumes();
  const [editing,    setEditing]    = useState(null);
  const [editVal,    setEditVal]    = useState("");
  const [viewResume, setViewResume] = useState(null);
  const resumeInput = useRef(null);
  const coverInput  = useRef(null);

  function handleFile(e, type) {
    const file = e.target.files?.[0];
    if (file) uploadResume(file, type);
    e.target.value = "";
  }

  function startRename(r) { setEditing(r.id); setEditVal(r.name); }
  function commitRename() { if (editVal.trim()) renameResume(editing, editVal.trim()); setEditing(null); }

  const cvs    = resumes.filter(r => r.type !== "cover_letter");
  const clMap  = Object.fromEntries(resumes.filter(r => r.type === "cover_letter").map(r => [r.id, r]));

  // Build: for each resume, which cover letters are paired with it?
  // _pairs comes from useResumes — [{partnerId, company}]
  function hatsFor(resume) {
    return (resume._pairs ?? [])
      .map(p => clMap[p.partnerId])
      .filter(Boolean);
  }

  // Cover letters not paired to any resume yet
  const pairedClIds = new Set(cvs.flatMap(r => (r._pairs ?? []).map(p => p.partnerId)));
  const unpairedCLs = resumes.filter(r => r.type === "cover_letter" && !pairedClIds.has(r.id));

  function renderDoc(r, isHat = false) {
    const { count, responses } = r._stats;
    const rate  = count ? Math.round(responses / count * 100) : null;
    const badge = !isHat ? getBadge(r, cvs) : null;
    const isCL  = r.type === "cover_letter";

    return (
      <div
        key={r.id}
        className={`rb-card${isHat ? " rb-card-hat" : ""}${isCL && !isHat ? " rb-card-cl-solo" : ""}`}
        style={{ cursor: "pointer" }}
        onClick={() => setViewResume(r)}
      >
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
            <span className={`rb-name${isHat ? " rb-hat-name" : ""}`} onClick={e => { e.stopPropagation(); startRename(r); }} title="Click to rename">{r.name}</span>
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

        {!isCL && (
          <>
            <div className="rb-date">{fmtDate(r.created_at)}</div>
            <div className="rb-stats">
              <span className="rb-stat"><strong>{count}</strong> sent</span>
              {rate !== null && <span className="rb-stat"><strong>{rate}%</strong> response</span>}
            </div>
            {badge && <span className="rb-badge" style={{ color: badge.color, borderColor: badge.color }}>{badge.label}</span>}
          </>
        )}

        {isHat && <div className="rb-hat-label">Cover Letter</div>}
      </div>
    );
  }

  const totalDocs = resumes.length;

  return (
    <>
    <div className="db-card db-resume-board">
      <div className="rb-header">
        <div>
          <div className="db-card-title">CV Vault</div>
          <div className="db-card-sub">{cvs.length} resume{cvs.length !== 1 ? "s" : ""} · {Object.keys(clMap).length} cover letter{Object.keys(clMap).length !== 1 ? "s" : ""}</div>
        </div>
        <div className="rb-upload-row">
          <input ref={resumeInput} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => handleFile(e, "resume")} />
          <input ref={coverInput}  type="file" accept=".pdf" style={{ display: "none" }} onChange={e => handleFile(e, "cover_letter")} />
          <button className="rb-upload-btn" disabled={uploading} onClick={() => resumeInput.current.click()}>+ Resume</button>
          <button className="rb-upload-btn" disabled={uploading} onClick={() => coverInput.current.click()}>+ Cover Letter</button>
        </div>
      </div>

      {totalDocs === 0 ? (
        <p className="db-app-empty">Upload resumes and cover letters. Pair them to applications and they'll stack here.</p>
      ) : (
        <div className="rb-cards">
          {cvs.map(r => {
            const hats = hatsFor(r);
            return (
              <div key={r.id} className="rb-stack-group">
                {hats.map(cl => renderDoc(cl, true))}
                {renderDoc(r, false)}
              </div>
            );
          })}

          {unpairedCLs.map(cl => renderDoc(cl, false))}
        </div>
      )}
    </div>

    {viewResume && (
      <ResumeDetailModal resume={viewResume} onClose={() => setViewResume(null)} getUrl={getUrl} />
    )}
    </>
  );
}
