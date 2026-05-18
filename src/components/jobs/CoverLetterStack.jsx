import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";

export default function CoverLetterStack({ apps }) {
  const letters = apps
    .filter(a => a.cover_letter)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (idx >= letters.length && letters.length > 0) setIdx(letters.length - 1);
  }, [letters.length, idx]);

  if (letters.length === 0) {
    return (
      <div className="cls-empty">
        <FileText size={32} className="cls-empty-icon" />
        <p className="cls-empty-title">No cover letters yet</p>
        <p className="cls-empty-sub">
          Click &ldquo;View &amp; Log Application&rdquo; on any job card<br />
          to write a cover letter &mdash; it will appear here.
        </p>
      </div>
    );
  }

  const cur  = letters[idx];
  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(letters.length - 1, i + 1));

  return (
    <div className="cls-root">
      <div className="cls-header">
        <span className="cls-title">Cover Letters</span>
        <span className="cls-count">{letters.length}</span>
      </div>

      <div className="cls-stack-area">
        {/* depth layers — peek behind the active card */}
        {letters.length > 2 && <div className="cls-depth cls-depth-3" />}
        {letters.length > 1 && <div className="cls-depth cls-depth-2" />}

        <div className="cls-card">
          <div className="cls-card-meta">
            <span className="cls-card-company">{cur.company}</span>
            <span className="cls-card-role">{cur.role}</span>
            <span className="cls-card-date">{cur.date}</span>
          </div>
          <pre className="cls-card-body">{cur.cover_letter}</pre>
        </div>
      </div>

      {letters.length > 1 && (
        <div className="cls-nav">
          <button className="cls-nav-btn" onClick={prev} disabled={idx === 0}>
            <ChevronLeft size={16} />
          </button>
          <span className="cls-nav-label">{idx + 1} / {letters.length}</span>
          <button className="cls-nav-btn" onClick={next} disabled={idx === letters.length - 1}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
