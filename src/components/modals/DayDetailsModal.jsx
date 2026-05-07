import { X } from "lucide-react";
import "./modals.css";

const EVENT_META = {
  interview: { dot: "#6366f1", text: "#6366f1", label: "Interview" },
  applied: { dot: "#34d399", text: "#34d399", label: "Applied" },
  followup: { dot: "#fbbf24", text: "#fbbf24", label: "Follow-up" },
};

export default function DayDetailsModal({
  dateLabel,
  events,
  onClose,
  onAdd,
  onDelete,
  onEdit,
}) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{dateLabel}</span>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={14} />
          </button>
        </div>

        <div
          className="cal-events-panel"
          style={{ border: "none", marginTop: 0 }}
        >
          {events.length > 0 ? (
            events.map((event, value) => {
              const meta = EVENT_META[event.type];
              return (
                <div
                  key={value}
                  className="cal-event-row"
                  style={{ borderLeftColor: meta.dot }}
                >
                  <span
                    className="cal-event-badge"
                    style={{ color: meta.text }}
                  >
                    {meta.label}
                  </span>
                  <span className="cal-event-label">{event.label}</span>

                  <div className="cal-event-actions">
                    <button onClick={() => onEdit(event)} type="button">
                      Edit
                    </button>
                    <button onClick={() => onDelete(event.id)} type="button">
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p>No events for this day.</p>
          )}
        </div>
        <div className="cal-add-event">
          <button onClick={() => onAdd()} type="button">
            Add Event
          </button>
        </div>
      </div>
    </div>
  );
}
