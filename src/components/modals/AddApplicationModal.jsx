import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { supabase } from "../../lib/supabase.js";
import "./modals.css";

const STATUS_OPTIONS = ["Applied", "Screening", "Interview", "Offer", "Rejected"];

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// Subdomains that belong to the ATS, not the company.
// When the first subdomain is one of these, the company slug is in the URL path instead.
const GENERIC_SUBDOMAINS = new Set(["jobs", "apply", "boards", "careers", "work", "hire", "job"]);

// Path segments that are structural (not company slugs).
const GENERIC_PATHS = new Set(["jobs", "careers", "apply", "job", "positions", "openings", "j"]);

// Extracts a human-readable company name from a job posting URL.
// Strategy: if the subdomain is a generic ATS prefix (apply., jobs., boards.),
// the company slug is in the first meaningful path segment. Otherwise the
// subdomain itself is the company name (e.g. stripe.workday.com).
function urlToCompany(raw) {
  try {
    const full = raw.startsWith("http") ? raw : "https://" + raw;
    const { hostname, pathname } = new URL(full);
    const host  = hostname.replace(/^www\./, "");
    const parts = host.split(".");
    const segs  = pathname.split("/").filter(s => s && !GENERIC_PATHS.has(s.toLowerCase()));

    const subdomain = parts.length > 2 ? parts[0].toLowerCase() : null;

    // Generic subdomain (apply.workable.com, jobs.lever.co, boards.greenhouse.io)
    // → company is the first non-generic path segment
    if (subdomain && GENERIC_SUBDOMAINS.has(subdomain) && segs[0])
      return cap(segs[0]);

    // Company-as-subdomain (stripe.workday.com, stripe.bamboohr.com)
    if (subdomain && !GENERIC_SUBDOMAINS.has(subdomain))
      return cap(subdomain);

    // Plain domain with no meaningful subdomain (linkedin.com, indeed.com)
    return cap(parts[0]);
  } catch {
    return "";
  }
}

// Returns true when the URL is parseable — used to show the "Parsed" tag.
function isValidUrl(raw) {
  try {
    const full = raw.startsWith("http") ? raw : "https://" + raw;
    return !!new URL(full).hostname;
  } catch { return false; }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// prefill: data from bookmarklet or query params (add mode, not edit mode)
// initial: existing row data for edit mode
export default function AddApplicationModal({ onClose, onAdd, initial, prefill }) {
  const [url, setUrl]         = useState(prefill?.url     || initial?.url     || "");
  const [company, setCompany] = useState(prefill?.company || initial?.company || "");
  const [role, setRole]       = useState(prefill?.role    || initial?.role    || "");
  const [status, setStatus]   = useState(initial?.status  || "Applied");
  const [date, setDate]       = useState(initial?.date    || todayISO());
  const [notes, setNotes]     = useState(initial?.notes   || "");
  const [parsed, setParsed]   = useState(false);
  const [resumeId, setResumeId] = useState(initial?.resume_id || null);
  const [resumes, setResumes]   = useState([]);

  useEffect(() => {
    supabase.from("resumes").select("id, name").order("created_at", { ascending: false })
      .then(({ data }) => setResumes(data ?? []));
  }, []);

  // ref not state — auto-fill tracking without triggering re-render
  const autoFilledRef = useRef(prefill?.company || initial?.company || "");

  useEffect(() => {
    if (!url) { setParsed(false); return; }
    if (isValidUrl(url)) {
      const name = urlToCompany(url);
      // only overwrite if empty OR still matches last auto-fill (user hasn't manually edited)
      setCompany((c) => (c === autoFilledRef.current || c === "") ? name : c);
      autoFilledRef.current = name;
      setParsed(true);
    } else {
      setParsed(false);
    }
  }, [url]);

  // On fresh add (no edit, no bookmarklet prefill): read clipboard for a job URL.
  // Silently ignored if clipboard is empty, non-URL, or permission is denied.
  useEffect(() => {
    if (initial || prefill?.url || prefill?.role) return;
    navigator.clipboard?.readText().then(text => {
      const t = text?.trim() ?? "";
      if (/^https?:\/\//i.test(t)) setUrl(t);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e) {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;
    onAdd({ url: url.trim(), company: company.trim(), role: role.trim(), status, date, notes: notes.trim(), resume_id: resumeId || null });
    onClose();
  }

  const canSubmit = company.trim().length > 0 && role.trim().length > 0;

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{initial ? "Edit Application" : "Add Application"}</span>
          <button className="modal-close" onClick={onClose} type="button"><X size={14} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label className="modal-label">
              Job URL <span className="modal-label-opt">(optional, auto-fills company)</span>
            </label>
            <div className="modal-url-wrap">
              <input
                className={`modal-input${parsed ? " modal-input-has-tag" : ""}`}
                type="text"
                placeholder="https://stripe.com/jobs/listing/123"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
              />
              {parsed && <span className="modal-url-tag">Parsed</span>}
            </div>
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Company *</label>
              <input className="modal-input" type="text" placeholder="Stripe"
                value={company} onChange={(e) => setCompany(e.target.value)} required />
            </div>
            <div className="modal-field">
              <label className="modal-label">Role Title *</label>
              <input className="modal-input" type="text" placeholder="Frontend Engineer"
                value={role} onChange={(e) => setRole(e.target.value)} required />
            </div>
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Status</label>
              <select className="modal-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="modal-field">
              <label className="modal-label">Date Applied</label>
              <input className="modal-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-label">Notes <span className="modal-label-opt">(optional)</span></label>
            <textarea className="modal-input" rows={2}
              placeholder="Referral from Alex · Senior role · Strong culture fit"
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {resumes.length > 0 && (
            <div className="modal-field">
              <label className="modal-label">Resume Used <span className="modal-label-opt">(optional)</span></label>
              <div className="modal-resume-pills">
                {resumes.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    className={`modal-resume-pill${resumeId === r.id ? " modal-resume-pill-active" : ""}`}
                    onClick={() => setResumeId(prev => prev === r.id ? null : r.id)}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="modal-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="modal-btn-submit" disabled={!canSubmit}>{initial ? "Save Changes" : "Add Application"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
