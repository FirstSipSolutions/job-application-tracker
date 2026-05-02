import { X } from "lucide-react";
import "./modals.css";

export default function LogoutModal({ onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 360 }}>
        <div className="modal-header">
          <span className="modal-title">Log out?</span>
          <button className="modal-close" onClick={onClose} type="button"><X size={14} /></button>
        </div>

        <p style={{ fontSize: 13, color: "var(--db-text-dim)", lineHeight: 1.6, marginBottom: 8 }}>
          You'll need to sign back in to access your applications.
        </p>

        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="modal-btn-submit modal-btn-danger" onClick={onConfirm}>Log out</button>
        </div>
      </div>
    </div>
  );
}
