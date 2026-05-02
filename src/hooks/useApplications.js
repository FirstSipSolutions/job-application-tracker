import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

export function useApplications() {
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);

  // fetch this user's applications on mount, newest first
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

  // insert and prepend the returned row (server assigns id + created_at)
  async function addApp(fields) {
    const { data: row, error } = await supabase
      .from("applications")
      .insert(fields)
      .select()
      .single();
    if (!error) setApps(prev => [row, ...prev]);
  }

  // optimistic — update local state immediately, sync to DB in background
  async function updateStatus(id, status) {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    await supabase.from("applications").update({ status }).eq("id", id);
  }

  async function removeApp(id) {
    setApps(prev => prev.filter(a => a.id !== id));
    await supabase.from("applications").delete().eq("id", id);
  }

  return { apps, loading, addApp, updateStatus, removeApp };
}
