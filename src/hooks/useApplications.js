import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

export function useApplications() {
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setApps(data ?? []);
        setLoading(false);
      });
  }, []);

  // waits for server row, needs the DB-generated UUID back
  async function addApp(fields) {
    const { data: row, error } = await supabase
      .from("applications")
      .insert(fields)
      .select()
      .single();
    if (!error) setApps(prev => [row, ...prev]);
  }

  // optimistic: state updates instantly, DB syncs in background
  async function updateApp(id, fields) {
    setApps(prev => prev.map(a => a.id === id ? { ...a, ...fields } : a));
    await supabase.from("applications").update(fields).eq("id", id);
  }

  async function updateStatus(id, status) {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    await supabase.from("applications").update({ status }).eq("id", id);
  }

  async function removeApp(id) {
    setApps(prev => prev.filter(a => a.id !== id));
    await supabase.from("applications").delete().eq("id", id);
  }

  return { apps, loading, addApp, updateApp, updateStatus, removeApp };
}
