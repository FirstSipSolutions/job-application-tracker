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
        {age && <span className="job-badge-age">{age}</span>}
      </div>

      {job.salary && (
        <div className="job-salary">{job.salary}</div>
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
