import { useEffect, useRef, useState } from "react";
import { ExternalLink, X } from "lucide-react";

export default function CoverLetterModal({ job, onConfirm, onClose }) {
  const [text, setText] = useState("");
  const taRef = useRef(null);

  useEffect(() => {
    taRef.current?.focus();
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="cl-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cl-modal" role="dialog" aria-modal="true">

        <div className="cl-header">
          <div className="cl-job-info">
            <span className="cl-job-title">{job.title}</span>
            <span className="cl-job-meta">{job.company}{job.source ? ` · ${job.source}` : ""}</span>
          </div>
          <button className="cl-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        <textarea
          ref={taRef}
          className="cl-textarea"
          placeholder="Write your cover letter here..."
          value={text}
          onChange={e => setText(e.target.value)}
          spellCheck
        />

        <div className="cl-footer">
          <button className="cl-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="cl-btn-secondary" onClick={() => onConfirm(null)}>
            Skip &amp; Open <ExternalLink size={13} />
          </button>
          <button
            className="cl-btn-primary"
            onClick={() => onConfirm(text.trim() || null)}
            disabled={!text.trim()}
          >
            Save &amp; Open <ExternalLink size={13} />
          </button>
        </div>

      </div>
    </div>
  );
}
