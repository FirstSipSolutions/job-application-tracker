// T00:00:00 prevents UTC offset from shifting the displayed day backward
function fmtDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// CSS vars can't be used in inline JS styles, so raw hex lives here
const STATUS_COLOR = {
  Applied:   "#5ba3ff",
  Screening: "#888",
  Interview: "#4cad7c",
  Offer:     "#4cad7c",
  Rejected:  "#e5989b",
};

export default function ApplicationsCard({ apps, loading, updateStatus, removeApp, onEdit }) {
  return (
    <div className="db-card db-actions">
      <div className="db-card-title">Applications</div>
      <div className="db-card-sub">{loading ? "Loading..." : `${apps.length} tracked`}</div>

      {loading ? null : apps.length === 0 ? (
        <p className="db-app-empty">No applications yet. Hit + Add Application to start.</p>
      ) : (
        <div className="db-app-list">
          <div className="db-app-row db-app-header">
            <span className="db-app-company">Company</span>
            <span className="db-app-role">Role</span>
            <span className="db-app-status-col">Status</span>
            <span className="db-app-date">Date</span>
            <span className="db-app-actions" />
          </div>

          {apps.map((app) => {
            const { id, company, role, status, date } = app;
            return (
              <div key={id} className="db-app-row">
                <span className="db-app-company">{company}</span>
                <span className="db-app-role">{role}</span>
                <select
                  className="db-app-status-col"
                  value={status}
                  onChange={(e) => updateStatus(id, e.target.value)}
                  style={{ color: STATUS_COLOR[status] ?? "#888" }}
                >
                  {Object.keys(STATUS_COLOR).map((opt) => <option key={opt}>{opt}</option>)}
                </select>
                <span className="db-app-date">{fmtDate(date)}</span>
                <div className="db-app-actions">
                  <button className="db-app-edit" onClick={() => onEdit(app)} title="Edit">✎</button>
                  <button className="db-app-del"  onClick={() => removeApp(id)} title="Delete">×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
