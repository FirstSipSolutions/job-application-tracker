import { useState, useEffect } from "react";
import { X, Download, ExternalLink } from "lucide-react";
import { supabase } from "../../lib/supabase.js";
import "./modals.css";

function fmtDate(iso) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_COLOR = {
  Applied:   "var(--db-text-dim)",
  Screening: "#5ba3ff",
  Interview: "#abc4ff",
  Offer:     "#4cad7c",
  Rejected:  "#e5989b",
};

export default function ResumeDetailModal({ resume, onClose, getUrl }) {
  const { count, responses, lastUsed } = resume._stats;
  const rate = count ? Math.round(responses / count * 100) : null;
  const [apps, setApps] = useState([]);

  useEffect(() => {
    supabase
      .from("applications")
      .select("company, role, status, date")
      .eq("resume_id", resume.id)
      .order("date", { ascending: false })
      .limit(8)
      .then(({ data }) => setApps(data ?? []));
  }, [resume.id]);

  return (
    <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{resume.name}</span>
          <button className="modal-close" onClick={onClose} type="button"><X size={14} /></button>
        </div>

        <div className="rdm-meta">
          <span>Uploaded {fmtDate(resume.created_at)}</span>
          <span>Last used {fmtDate(lastUsed)}</span>
        </div>

        <div className="rdm-stats">
          <div className="rdm-stat-box">
            <span className="rdm-stat-num">{count}</span>
            <span className="rdm-stat-label">times sent</span>
          </div>
          <div className="rdm-stat-box">
            <span className="rdm-stat-num">{rate !== null ? `${rate}%` : "--"}</span>
            <span className="rdm-stat-label">response rate</span>
          </div>
          <div className="rdm-stat-box">
            <span className="rdm-stat-num">{responses}</span>
            <span className="rdm-stat-label">interviews / offers</span>
          </div>
        </div>

        {apps.length > 0 && (
          <div className="rdm-apps">
            <div className="rdm-apps-title">Sent with this resume</div>
            <div className="rdm-apps-list">
              {apps.map((a, i) => (
                <div key={i} className="rdm-app-row">
                  <span className="rdm-app-company">{a.company}</span>
                  <span className="rdm-app-role">{a.role}</span>
                  <span className="rdm-app-status" style={{ color: STATUS_COLOR[a.status] }}>{a.status}</span>
                  <span className="rdm-app-date">{fmtDate(a.date)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {apps.length === 0 && count === 0 && (
          <p className="rdm-empty">No applications linked yet. Select this resume when logging a job.</p>
        )}

        <div className="modal-footer">
          <button type="button" className="modal-btn-cancel" onClick={onClose}>Close</button>
          <button type="button" className="modal-btn-cancel" onClick={async () => { const url = await getUrl(resume.file_path); if (url) window.open(url, "_blank"); }}>
            <ExternalLink size={13} style={{ marginRight: 5 }} />Open
          </button>
          <button type="button" className="modal-btn-submit" onClick={async () => { const url = await getUrl(resume.file_path, `${resume.name}.pdf`); if (url) { const a = document.createElement("a"); a.href = url; a.click(); } }}>
            <Download size={13} style={{ marginRight: 5 }} />Download
          </button>
        </div>
      </div>
    </div>
  );
}
