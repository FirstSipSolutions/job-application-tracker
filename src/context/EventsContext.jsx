import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

const EventsContext = createContext(null);

function loadDismissed() {
  try { return new Set(JSON.parse(localStorage.getItem("dismissed-events")) || []); }
  catch { return new Set(); }
}

export function EventsProvider({ children }) {
  const [events,    setEvents]    = useState([]);
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
    if (!error) setEvents(prev => [...prev, row]);
  }

  // dismissed stays in localStorage, it's a UI preference not worth syncing to DB
  // key format: "2026-05-08::Google Interview" — unique per event
  function dismissEvent(key) {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(key);
      localStorage.setItem("dismissed-events", JSON.stringify([...next]));
      return next;
    });
  }

  return (
    <EventsContext.Provider value={{ events, addEvent, dismissed, dismissEvent }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() { return useContext(EventsContext); }
