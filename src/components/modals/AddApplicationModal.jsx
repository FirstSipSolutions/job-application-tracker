import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import "./modals.css";

const STATUS_OPTIONS = ["Applied", "Screening", "Interview", "Offer", "Rejected"];

// prepend https:// so new URL() doesn't throw on bare domains
function extractDomain(raw) {
  try {
    const url = raw.startsWith("http") ? raw : "https://" + raw;
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// "stripe.com" → "Stripe"
function domainToCompany(domain) {
  const name = domain.split(".")[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddApplicationModal({ onClose, onAdd, initial }) {
  const [url, setUrl]         = useState(initial?.url     || "");
  const [company, setCompany] = useState(initial?.company || "");
  const [role, setRole]       = useState(initial?.role    || "");
  const [status, setStatus]   = useState(initial?.status  || "Applied");
  const [date, setDate]       = useState(initial?.date    || todayISO());
  const [notes, setNotes]     = useState(initial?.notes   || "");
  const [parsed, setParsed]   = useState(false);

  // ref not state — tracking last auto-filled value without causing a re-render
  const autoFilledRef = useRef(initial?.company || "");

  useEffect(() => {
    const domain = extractDomain(url);
    if (domain) {
      const name = domainToCompany(domain);
      // only overwrite if empty OR still matches last auto-fill (user hasn't manually edited)
      setCompany((c) => (c === autoFilledRef.current || c === "") ? name : c);
      autoFilledRef.current = name;
      setParsed(true);
    } else {
      setParsed(false);
    }
  }, [url]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;
    onAdd({ url: url.trim(), company: company.trim(), role: role.trim(), status, date, notes: notes.trim() });
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

          <div className="modal-footer">
            <button type="button" className="modal-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="modal-btn-submit" disabled={!canSubmit}>{initial ? "Save Changes" : "Add Application"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
