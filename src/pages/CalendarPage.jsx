import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AppNav from "../components/layout/AppNav.jsx";
import AddEventModal from "../components/modals/AddEventModal.jsx";
import { useEvents } from "../context/EventsContext.jsx";
import "../styles/dashboard.css";
import "../styles/calendar.css";


const EVENT_META = {
  interview: { dot: "#6366f1", text: "#6366f1", label: "Interview" },
  applied:   { dot: "#34d399", text: "#34d399", label: "Applied"   },
  followup:  { dot: "#fbbf24", text: "#fbbf24", label: "Follow-up" },
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function buildGrid(year, month) {
  const firstDow    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++)     cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  return cells;
}

function fmtKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function fmtLabel(year, month, day) {
  return new Date(year, month, day).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear]       = useState(today.getFullYear());
  const [month, setMonth]     = useState(today.getMonth());
  const [selected, setSelected] = useState(null);
  const { events, addEvent: pushEvent } = useEvents();
  const [showAdd, setShowAdd] = useState(false);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setSelected(null); };
  const nextMonth = () => { if (month === 11) { setMonth(0);  setYear(y => y + 1); } else setMonth(m => m + 1); setSelected(null); };

  // ??= creates the key array on first use
  const byDate = events.reduce((acc, e) => {
    (acc[e.date] ??= []).push(e);
    return acc;
  }, {});

  const cells         = buildGrid(year, month);
  const selectedKey   = selected ? fmtKey(year, month, selected) : null;
  const selectedEvents = selectedKey ? (byDate[selectedKey] ?? []) : [];

  const defaultDate = selected ? fmtKey(year, month, selected) : todayISO();

  function addEvent(ev) {
    pushEvent(ev);
    const [y, m, d] = ev.date.split("-").map(Number);
    if (y === year && m - 1 === month) setSelected(d);
  }

  return (
    <div className="db-root">
      <AppNav onAddEvent={() => setShowAdd(true)} />

      <main className="db-main">
        <div className="db-greeting">
          <h1>Calendar</h1>
          <p>Interviews, applications, and follow-up reminders in one view.</p>
        </div>

        <div className="cal-wrap">
          <div className="cal-header">
            <button className="cal-nav-btn" onClick={prevMonth}><ChevronLeft size={14} /></button>
            <span className="cal-month-label">{MONTHS[month]} {year}</span>
            <button className="cal-nav-btn" onClick={nextMonth}><ChevronRight size={14} /></button>
          </div>

          <div className="cal-grid">
            {DOW.map(d => <div key={d} className="cal-dow">{d}</div>)}

            {cells.map(({ day }, i) => {
              if (!day) return <div key={i} className="cal-cell" />;

              const key     = fmtKey(year, month, day);
              const evs     = byDate[key] ?? [];
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isSel   = day === selected;

              return (
                <div
                  key={i}
                  className={["cal-cell", evs.length ? "has-events" : "", isToday ? "cal-today" : "", isSel ? "cal-selected" : ""].join(" ")}
                  onClick={() => evs.length && setSelected(isSel ? null : day)}
                >
                  <span className="cal-day-num">{day}</span>
                  {evs.length > 0 && (
                    <div className="cal-dots">
                      {evs.slice(0, 3).map((e, j) => (
                        <span key={j} className="cal-dot" style={{ background: EVENT_META[e.type].dot }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedEvents.length > 0 && (
            <div className="cal-events-panel">
              <div className="cal-events-date">{fmtLabel(year, month, selected)}</div>
              {selectedEvents.map((e, i) => {
                const meta = EVENT_META[e.type];
                return (
                  <div key={i} className="cal-event-row" style={{ borderLeftColor: meta.dot }}>
                    <span className="cal-event-badge" style={{ color: meta.text }}>{meta.label}</span>
                    <span className="cal-event-label">{e.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="cal-legend">
            {Object.entries(EVENT_META).map(([type, { dot, label }]) => (
              <div key={type} className="cal-legend-item">
                <span className="cal-dot" style={{ background: dot }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </main>

      {showAdd && (
        <AddEventModal
          defaultDate={defaultDate}
          onClose={() => setShowAdd(false)}
          onAdd={addEvent}
        />
      )}
    </div>
  );
}

