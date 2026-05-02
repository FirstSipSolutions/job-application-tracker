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

export default function UpcomingPanel() {
  const { events, dismissed, dismissEvent } = useEvents();
  const today = new Date().toISOString().slice(0, 10);
  const weekOut = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);

  const upcoming = events
    .filter(e => e.date >= today && e.date <= weekOut && !dismissed.has(`${e.date}::${e.label}`))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (upcoming.length === 0) {
    return <p className="upcoming-empty">Nothing in the next 7 days.</p>;
  }

  return (
    <div className="upcoming-list">
      {upcoming.map(e => {
        const key = `${e.date}::${e.label}`;
        return (
          <div key={key} className="upcoming-row">
            <div className="upcoming-body">
              <span className="upcoming-type" style={{ color: TYPE[e.type].color }}>{TYPE[e.type].label}</span>
              <span className="upcoming-label">{e.label}</span>
              <span className="upcoming-date">{fmtDate(e.date)}</span>
            </div>
            <button className="upcoming-dismiss" onClick={() => dismissEvent(key)} title="Dismiss">
              <X size={11} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
