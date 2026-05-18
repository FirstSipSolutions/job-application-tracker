import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { supabase } from "../../lib/supabase.js";
import { STATUS_OPTIONS, STATUS_COLOR } from "../../lib/status.js";

function fmtDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function useDocuments() {
  const [resumes, setResumes]      = useState([]);
  const [coverLetters, setCL]      = useState([]);
  useEffect(() => {
    supabase.from("resumes").select("id, name, type").order("created_at", { ascending: false })
      .then(({ data }) => {
        const docs = data ?? [];
        setResumes(docs.filter(d => d.type !== "cover_letter"));
        setCL(docs.filter(d => d.type === "cover_letter"));
      });
  }, []);
  return { resumes, coverLetters };
}

function QuickPairRow({ app, resumes, coverLetters, onSave, onClose }) {
  const [resumeId, setResumeId]         = useState(app.resume_id       ?? "");
  const [coverLetterId, setCoverLetter] = useState(app.cover_letter_id ?? "");
  const rowRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (rowRef.current && !rowRef.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div className="qp-row" ref={rowRef}>
      {app.url && (
        <a className="qp-open-btn" href={app.url} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={13} /> Open Job
        </a>
      )}

      <select className="qp-select" value={resumeId} onChange={e => setResumeId(e.target.value)}>
        <option value="">No resume</option>
        {resumes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>

      <select className="qp-select qp-select-cl" value={coverLetterId} onChange={e => setCoverLetter(e.target.value)}>
        <option value="">No cover letter</option>
        {coverLetters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <button
        className="qp-save"
        onClick={() => {
          onSave(app.id, {
            resume_id:       resumeId       || null,
            cover_letter_id: coverLetterId  || null,
          });
          onClose();
        }}
      >
        Save
      </button>
    </div>
  );
}

export default function JobApplicationBoard({ apps, loading, updateStatus, updateApp, removeApp, onEdit }) {
  const { resumes, coverLetters } = useDocuments();
  const [expanded, setExpanded]   = useState(null);

  function toggle(id) { setExpanded(prev => prev === id ? null : id); }

  return (
    <div className="db-card db-app-board">
      <div className="db-card-title">Job Application Board</div>
      <div className="db-card-sub">{loading ? "Loading..." : `${apps.length} tracked`}</div>

      {loading ? null : apps.length === 0 ? (
        <p className="db-app-empty">No applications yet. Hit + Add Application to start.</p>
      ) : (
        <div className="db-app-list">
          <div className="db-app-row db-app-header">
            <span className="db-app-company">Company</span>
            <span className="db-app-role">Role</span>
            <span className="db-app-status-col">Status</span>
            <span className="db-app-date">Date</span>
            <span className="db-app-actions" />
          </div>

          {apps.map((app) => {
            const { id, company, role, status, date } = app;
            const hasDocs = app.resume_id || app.cover_letter_id;
            return (
              <div key={id}>
                <div
                  className={`db-app-row${expanded === id ? " db-app-row-open" : ""}`}
                  onClick={() => toggle(id)}
                  style={{ cursor: "pointer" }}
                >
                  <span className="db-app-company">
                    {company}
                    {hasDocs && <span className="db-app-paired-dot" title="Documents paired" />}
                  </span>
                  <span className="db-app-role">{role}</span>
                  <select
                    className="db-app-status-col"
                    value={status}
                    onClick={e => e.stopPropagation()}
                    onChange={(e) => { e.stopPropagation(); updateStatus(id, e.target.value); }}
                    style={{ color: STATUS_COLOR[status] ?? "#888" }}
                  >
                    {STATUS_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
                  </select>
                  <span className="db-app-date">{fmtDate(date)}</span>
                  <div className="db-app-actions" onClick={e => e.stopPropagation()}>
                    <button className="db-app-edit" onClick={() => onEdit(app)} title="Full edit">✎</button>
                    <button className="db-app-del"  onClick={() => removeApp(id)} title="Delete">×</button>
                  </div>
                </div>

                {expanded === id && (
                  <QuickPairRow
                    app={app}
                    resumes={resumes}
                    coverLetters={coverLetters}
                    onSave={updateApp}
                    onClose={() => setExpanded(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
