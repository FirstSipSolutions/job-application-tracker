import { X } from "lucide-react";
import { useEvents } from "../../context/EventsContext.jsx";

const TYPE = {
  interview: { color: "#6366f1", label: "Interview" },
  applied:   { color: "#34d399", label: "Applied"   },
  followup:  { color: "#fbbf24", label: "Follow-up" },
};

function fmtDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function UrgentPanel() {
  const { events, dismissed, dismissEvent } = useEvents();
  const today = new Date().toISOString().slice(0, 10);

  const missed = events
    .filter(e => e.date < today && !dismissed.has(`${e.date}::${e.label}`))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (missed.length === 0) {
    return <p className="urgent-empty">All clear.</p>;
  }

  return (
    <div className="urgent-list">
      {missed.map(e => {
        const key = `${e.date}::${e.label}`;
        return (
          <div key={key} className="urgent-row urgent-overdue">
            <div className="urgent-body">
              <span className="urgent-type" style={{ color: TYPE[e.type].color }}>{TYPE[e.type].label}</span>
              <span className="urgent-label">{e.label}</span>
              <span className="urgent-date">{fmtDate(e.date)}</span>
            </div>
            <button className="urgent-dismiss" onClick={() => dismissEvent(key)} title="Dismiss">
              <X size={11} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
