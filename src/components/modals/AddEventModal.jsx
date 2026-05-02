import { useState } from "react";
import { X } from "lucide-react";
import "./modals.css";

export default function AddEventModal({ defaultDate, onClose, onAdd }) {
  const [date, setDate]   = useState(defaultDate);
  const [type, setType]   = useState("interview");
  const [label, setLabel] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!label.trim()) return;
    onAdd({ date, type, label: label.trim() });
    onClose();
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">Add Event</span>
          <button className="modal-close" onClick={onClose} type="button"><X size={14} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Date</label>
              <input className="modal-input" type="date" value={date}
                onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="modal-field">
              <label className="modal-label">Type</label>
              <select className="modal-input" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="interview">Interview</option>
                <option value="applied">Applied</option>
                <option value="followup">Follow-up</option>
              </select>
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-label">Description</label>
            <input className="modal-input" type="text" autoFocus required
              placeholder="Technical Screen @ Google · 2:00 PM"
              value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>

          <div className="modal-footer">
            <button type="button" className="modal-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="modal-btn-submit" disabled={!label.trim()}>Add Event</button>
          </div>
        </form>
      </div>
    </div>
  );
}
