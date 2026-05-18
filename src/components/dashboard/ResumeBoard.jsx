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
  const [expanded,   setExpanded]   = useState(null);
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
  function toggle(id) { setExpanded(prev => prev === id ? null : id); }

  const cvs   = resumes.filter(r => r.type !== "cover_letter");
  const clMap = Object.fromEntries(resumes.filter(r => r.type === "cover_letter").map(r => [r.id, r]));

  function hatsFor(resume) {
    return (resume._pairs ?? []).map(p => clMap[p.partnerId]).filter(Boolean);
  }

  const pairedClIds = new Set(cvs.flatMap(r => (r._pairs ?? []).map(p => p.partnerId)));
  const unpairedCLs = resumes.filter(r => r.type === "cover_letter" && !pairedClIds.has(r.id));

  // ── Expanded popout card ──────────────────────────────────────────────────

  function renderHat(cl) {
    return (
      <div key={cl.id} className="rb-hat-strip" onClick={() => setViewResume(cl)}>
        <span className="rb-hat-strip-pill">CL</span>
        <span className="rb-hat-strip-name" title={cl.name}>{cl.name}</span>
        <div className="rb-hat-strip-actions" onClick={e => e.stopPropagation()}>
          <button className="rb-icon-btn" title="Open" onClick={async () => { const url = await getUrl(cl.file_path); if (url) window.open(url, "_blank"); }}>
            <ExternalLink size={11} />
          </button>
          <button className="rb-icon-btn rb-icon-del" onClick={() => removeResume(cl.id)} title="Delete">×</button>
        </div>
      </div>
    );
  }

  function renderCard(r) {
    const { count, responses } = r._stats;
    const rate  = count ? Math.round(responses / count * 100) : null;
    const badge = r.type !== "cover_letter" ? getBadge(r, cvs) : null;
    const isCL  = r.type === "cover_letter";

    return (
      <div
        key={r.id}
        className={`rb-card${isCL ? " rb-card-cl-solo" : ""}`}
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
        {!isCL && (
          <>
            <div className="rb-stats">
              <span className="rb-stat"><strong>{count}</strong> sent</span>
              {rate !== null && <span className="rb-stat"><strong>{rate}%</strong> response</span>}
            </div>
            {badge && <span className="rb-badge" style={{ color: badge.color, borderColor: badge.color }}>{badge.label}</span>}
          </>
        )}
      </div>
    );
  }

  // ── Compact list row ──────────────────────────────────────────────────────

  function renderRow(r, hats = []) {
    const { count, responses } = r._stats;
    const rate  = count ? Math.round(responses / count * 100) : null;
    const badge = r.type !== "cover_letter" ? getBadge(r, cvs) : null;
    const isCL  = r.type === "cover_letter";
    const isOpen = expanded === r.id;

    return (
      <div key={r.id} className="rb-list-item">
        <div
          className={`rb-list-row${isOpen ? " rb-list-row-open" : ""}`}
          onClick={() => toggle(r.id)}
        >
          {isCL && <span className="rb-list-cl-pill">CL</span>}
          <span className="rb-list-name">{r.name}</span>
          {!isCL && (
            <span className="rb-list-stats">
              {count} sent{rate !== null ? ` · ${rate}% resp` : ""}
            </span>
          )}
          {hats.length > 0 && (
            <span className="rb-list-cl-tag">{hats.length} CL{hats.length !== 1 ? "s" : ""}</span>
          )}
          {badge && (
            <span className="rb-list-badge" style={{ color: badge.color }}>{badge.label}</span>
          )}
          <span className="rb-list-chevron">{isOpen ? "▾" : "▸"}</span>
        </div>

        {isOpen && (
          <div className="rb-list-popout">
            {hats.length > 0 ? (
              <div className="rb-stack-group">
                {hats.map(cl => renderHat(cl))}
                {renderCard(r)}
              </div>
            ) : renderCard(r)}
          </div>
        )}
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
        <div className="rb-list">
          {cvs.map(r => renderRow(r, hatsFor(r)))}
          {unpairedCLs.length > 0 && (
            <>
              {cvs.length > 0 && <div className="rb-list-divider" />}
              {unpairedCLs.map(cl => renderRow(cl, []))}
            </>
          )}
        </div>
      )}
    </div>

    {viewResume && (
      <ResumeDetailModal resume={viewResume} onClose={() => setViewResume(null)} getUrl={getUrl} />
    )}
    </>
  );
}
