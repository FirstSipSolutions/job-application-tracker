import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

// Fetches resumes and their stats in two parallel queries instead of loading
// all application rows into the browser. Users can have hundreds of applications
// so we only pull the two columns we need (resume_id, status) and aggregate
// client-side from that small payload rather than filtering a full app array.
async function fetchResumesWithStats() {
  const [{ data: rows }, { data: stats }] = await Promise.all([
    supabase.from("resumes").select("*").order("created_at", { ascending: false }),
    // Only fetch rows that have a resume attached. Skips the majority of applications
    // and avoids shipping unrelated data to the browser.
    supabase.from("applications").select("resume_id, status, date").not("resume_id", "is", null),
  ]);

  // DATA STRUCTURE: Hash Map (plain object used as a key-value store)
  //
  // Problem: we have N applications and M resumes. A naive approach would loop
  // through every application once per resume card to count matches: O(N*M).
  // With 200 applications and 10 resumes that is 2,000 iterations on every render.
  //
  // Solution: one pass over the applications array builds a hash map keyed by
  // resume_id. Each key maps to an object holding the running counts.
  // Inserting and reading from a hash map is O(1) average case (JavaScript
  // objects use a hash table internally), so the full build is O(N) and each
  // resume card lookup is O(1). Total complexity: O(N + M) instead of O(N*M).
  //
  // Trade-off: we use a small amount of extra memory to store the map, but that
  // is negligible compared to the CPU saved at render time.
  const statMap = {};
  for (const app of stats ?? []) {
    if (!statMap[app.resume_id]) statMap[app.resume_id] = { count: 0, responses: 0, lastUsed: null };
    statMap[app.resume_id].count++;
    if (["Interview", "Offer"].includes(app.status)) statMap[app.resume_id].responses++;
    if (!statMap[app.resume_id].lastUsed || app.date > statMap[app.resume_id].lastUsed)
      statMap[app.resume_id].lastUsed = app.date;
  }

  // Attach stats directly to each resume so components never need the apps array.
  return (rows ?? []).map(r => ({ ...r, _stats: statMap[r.id] ?? { count: 0, responses: 0, lastUsed: null } }));
}

export function useResumes() {
  const [resumes,   setResumes]   = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchResumesWithStats().then(setResumes);
  }, []);

  async function uploadResume(file) {
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const id   = crypto.randomUUID();
    // Scope the file path to the user's ID so storage RLS can enforce ownership
    // by checking the first folder segment matches auth.uid().
    const path = `${user.id}/${id}.pdf`;

    const { error: storageErr } = await supabase.storage
      .from("resumes")
      .upload(path, file, { contentType: "application/pdf" });

    if (storageErr) { console.error("storage upload failed:", storageErr); setUploading(false); return; }

    const name = file.name.replace(/\.pdf$/i, "");
    const { data: row, error: dbErr } = await supabase
      .from("resumes")
      .insert({ id, name, file_path: path })
      .select()
      .single();

    // Seed _stats so the new card renders immediately without a refetch.
    if (!dbErr) setResumes(prev => [{ ...row, _stats: { count: 0, responses: 0 } }, ...prev]);
    setUploading(false);
  }

  async function renameResume(id, name) {
    // Optimistic update. UI reflects the change instantly, DB syncs in background.
    setResumes(prev => prev.map(r => r.id === id ? { ...r, name } : r));
    await supabase.from("resumes").update({ name }).eq("id", id);
  }

  async function removeResume(id) {
    const resume = resumes.find(r => r.id === id);
    // Optimistic removal. Card disappears before the two async deletes complete.
    setResumes(prev => prev.filter(r => r.id !== id));
    // Delete from storage first so the file does not linger if the
    // DB delete succeeds but storage does not.
    await supabase.storage.from("resumes").remove([resume.file_path]);
    await supabase.from("resumes").delete().eq("id", id);
  }

  async function getUrl(file_path, download = false) {
    // Signed URL expires in 60 seconds. Never expose a public URL for resumes
    // since they contain personal information. The download flag adds
    // Content-Disposition: attachment so the browser saves the file instead of opening it.
    // download can be a filename string, Supabase uses it for Content-Disposition.
    const { data } = await supabase.storage
      .from("resumes")
      .createSignedUrl(file_path, 60, download ? { download } : undefined);
    return data?.signedUrl;
  }

  return { resumes, uploading, uploadResume, renameResume, removeResume, getUrl };
}
