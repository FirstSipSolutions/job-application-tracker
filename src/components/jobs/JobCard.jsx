const CATEGORY_LABEL = {
  "devtools": "Dev Tools",
  "security": "Security",
  "fintech":  "Fintech",
  "canadian": "Canadian",
};

const CATEGORY_COLOR = {
  "devtools": "#5ba3ff",
  "security": "#f97316",
  "fintech":  "#4cad7c",
  "canadian": "#ef4444",
};

function daysAgoLabel(postedAt) {
  if (!postedAt) return null;
  const d = Math.floor((Date.now() - new Date(postedAt)) / 864e5);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}

export default function JobCard({ job, onApply }) {
  const age = daysAgoLabel(job.postedAt);

  return (
    <div className="job-card">
      <div className="job-card-badges">
        <span className="job-badge job-badge-remote">Remote</span>
        {job.category && CATEGORY_LABEL[job.category] && (
          <span
            className="job-badge job-badge-category"
            style={{ color: CATEGORY_COLOR[job.category] }}
          >
            {CATEGORY_LABEL[job.category]}
          </span>
        )}
        {age && <span className="job-badge-age">{age}</span>}
      </div>

      {job.salary && (
        <div className="job-salary">
          {job.salary}
          {job.currency && <span className="job-salary-currency">({job.currency})</span>}
        </div>
      )}

      <h3 className="job-title">{job.title}</h3>
      <div className="job-company">{job.company}</div>
      {job.location && job.location !== "Remote" && (
        <div className="job-location">{job.location}</div>
      )}

      <button className="job-apply-btn" onClick={() => onApply(job)}>
        View &amp; Log Application
      </button>
    </div>
  );
}
