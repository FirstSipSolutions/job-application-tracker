import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

const EventsContext = createContext(null);

function loadDismissed() {
  try {
    return new Set(JSON.parse(localStorage.getItem("dismissed-events")) || []);
  } catch {
    return new Set();
  }
}

export function EventsProvider({ children }) {
  const [events, setEvents] = useState([]);

  // DATA STRUCTURE: Set
  //
  // dismissed tracks which events the user has hidden from the Upcoming panel.
  // A Set is the right structure here because the only operations needed are:
  //   - add(key)        O(1)
  //   - has(key)        O(1)  <- called on every event during the filter below
  //
  // If this were an array, has() would be O(N): a linear scan every time the
  // panel re-renders. With a Set it is O(1) regardless of how many events are
  // dismissed. The key is a composite string "date::label" which makes each
  // event uniquely identifiable without needing a database ID.
  const [dismissed, setDismissed] = useState(loadDismissed);

  useEffect(() => {
    supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true })
      .then(({ data, error }) => {
        if (!error) setEvents(data ?? []);
      });
  }, []);

  async function addEvent(fields) {
    const { data: row, error } = await supabase
      .from("events")
      .insert(fields)
      .select()
      .single();
    if (!error) setEvents((prev) => [...prev, row]);
  }

  async function deleteEvent(eventId) {
    const { data: error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId)
      .select()
      .single();
    if (!error)
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
  }

  async function updateEvent(eventId, fields) {
    const { data: row, error } = await supabase
      .from("events")
      .update(fields)
      .eq("id", eventId)
      .select()
      .single();
    if (!error)
      setEvents((prev) =>
        prev.map((event) => (event.id == eventId ? row : event)),
      );
  }

  // dismissed stays in localStorage, it's a UI preference not worth syncing to DB
  // key format: "2026-05-08::Google Interview" unique per event
  function dismissEvent(key) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(key);
      localStorage.setItem("dismissed-events", JSON.stringify([...next]));
      return next;
    });
  }

  return (
    <EventsContext.Provider
      value={{
        events,
        addEvent,
        dismissed,
        dismissEvent,
        deleteEvent,
        updateEvent,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEvents() {
  return useContext(EventsContext);
}
