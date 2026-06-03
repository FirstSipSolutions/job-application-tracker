import { useState } from "react";
import { X } from "lucide-react";
import "./modals.css";

export default function EditEventModal({
  defaultDate,
  onSave,
  event,
  onClose,
}) {
  const [date, setDate] = useState(event.date);
  const [type, setType] = useState(event.type);
  const [label, setLabel] = useState(event.label);

  function handleSubmit(e) {
    e.preventDefault();
    if (!label.trim()) return;
    onSave(event.id, { date, type, label: label.trim() });
    onClose();
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">Update Event</span>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Date</label>
              <input
                className="modal-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="modal-field">
              <label className="modal-label">Type</label>
              <select
                className="modal-input"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="interview">Interview</option>
                <option value="applied">Applied</option>
                <option value="followup">Follow-up</option>
              </select>
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-label">Description</label>
            <input
              className="modal-input"
              type="text"
              autoFocus
              required
              placeholder="Technical Screen @ Google · 2:00 PM"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="modal-btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-btn-submit"
              disabled={!label.trim()}
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
