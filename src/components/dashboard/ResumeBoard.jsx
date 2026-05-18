import { useRef, useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { useResumes } from "../../hooks/useResumes.js";
import ResumeDetailModal from "../modals/ResumeDetailModal.jsx";

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getBadge(resume, allResumes) {
  if (resume.type === "cover_letter") return { label: "Cover Letter", color: "#a78bfa" };
  const { count } = resume._stats;
  const daysSince = (Date.now() - new Date(resume.created_at)) / 864e5;
  const maxUsed   = Math.max(...allResumes.filter(r => r.type !== "cover_letter").map(r => r._stats.count), 0);
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

  const total  = resumes.length;
  const cvs    = resumes.filter(r => r.type !== "cover_letter").length;
  const covers = resumes.filter(r => r.type === "cover_letter").length;

  return (
    <>
    <div className="db-card db-resume-board">
      <div className="rb-header">
        <div>
          <div className="db-card-title">CV Vault</div>
          <div className="db-card-sub">
            {cvs} resume{cvs !== 1 ? "s" : ""}
            {covers > 0 && ` · ${covers} cover letter${covers !== 1 ? "s" : ""}`}
          </div>
        </div>

        <div className="rb-upload-row">
          <input ref={resumeInput} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => handleFile(e, "resume")} />
          <input ref={coverInput}  type="file" accept=".pdf" style={{ display: "none" }} onChange={e => handleFile(e, "cover_letter")} />
          <button className="rb-upload-btn" disabled={uploading} onClick={() => resumeInput.current.click()}>
            + Resume
          </button>
          <button className="rb-upload-btn" disabled={uploading} onClick={() => coverInput.current.click()}>
            + Cover Letter
          </button>
        </div>
      </div>

      {total === 0 ? (
        <p className="db-app-empty">Upload resumes and cover letters to keep them sorted and linked to your applications.</p>
      ) : (
        <div className="rb-cards">
          {resumes.map(r => {
            const { count, responses } = r._stats;
            const rate  = count ? Math.round(responses / count * 100) : null;
            const badge = getBadge(r, resumes);
            const isCL  = r.type === "cover_letter";
            return (
              <div key={r.id} className={`rb-card${isCL ? " rb-card-cl" : ""}`} style={{ cursor: "pointer" }} onClick={() => setViewResume(r)}>
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
                    <button className="rb-icon-btn rb-icon-del" onClick={() => removeResume(r.id)} title="Delete">x</button>
                  </div>
                </div>

                <div className="rb-date">{fmtDate(r.created_at)}</div>

                {!isCL && (
                  <div className="rb-stats">
                    <span className="rb-stat"><strong>{count}</strong> sent</span>
                    {rate !== null && <span className="rb-stat"><strong>{rate}%</strong> response</span>}
                  </div>
                )}

                {badge && (
                  <span className="rb-badge" style={{ color: badge.color, borderColor: badge.color }}>
                    {badge.label}
                  </span>
                )}

                {r._pairs.length > 0 && (
                  <div className="rb-pairs">
                    {r._pairs.slice(0, 2).map((p, i) => (
                      <span key={i} className="rb-pair-chip" title={p.company}>
                        {isCL ? "CV" : "CL"} · {r._docMap[p.partnerId] ?? "Linked"}{p.company ? ` — ${p.company}` : ""}
                      </span>
                    ))}
                    {r._pairs.length > 2 && <span className="rb-pair-more">+{r._pairs.length - 2} more</span>}
                  </div>
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
