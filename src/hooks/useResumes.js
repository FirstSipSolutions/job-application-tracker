import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

// Fetches resumes and their stats in two parallel queries instead of loading
// all application rows into the browser. Users can have hundreds of applications
// so we only pull the two columns we need (resume_id, status) and aggregate
// client-side from that small payload rather than filtering a full app array.
async function fetchResumesWithStats() {
  const [{ data: rows }, { data: stats }, { data: pairs }] = await Promise.all([
    supabase.from("resumes").select("*").order("created_at", { ascending: false }),
    supabase.from("applications").select("resume_id, status, date").not("resume_id", "is", null),
    supabase.from("applications")
      .select("resume_id, cover_letter_id, company")
      .not("resume_id", "is", null)
      .not("cover_letter_id", "is", null),
  ]);

  const statMap = {};
  for (const app of stats ?? []) {
    if (!statMap[app.resume_id]) statMap[app.resume_id] = { count: 0, responses: 0, lastUsed: null };
    statMap[app.resume_id].count++;
    if (["Interview", "Offer"].includes(app.status)) statMap[app.resume_id].responses++;
    if (!statMap[app.resume_id].lastUsed || app.date > statMap[app.resume_id].lastUsed)
      statMap[app.resume_id].lastUsed = app.date;
  }

  // Build pairing maps: resume_id → [{ cover_letter_id, company }]
  //                    cover_letter_id → [{ resume_id, company }]
  const resumePairs = {};
  const clPairs     = {};
  for (const p of pairs ?? []) {
    if (!resumePairs[p.resume_id])      resumePairs[p.resume_id]      = [];
    if (!clPairs[p.cover_letter_id])    clPairs[p.cover_letter_id]    = [];
    resumePairs[p.resume_id].push({ partnerId: p.cover_letter_id, company: p.company });
    clPairs[p.cover_letter_id].push({ partnerId: p.resume_id,      company: p.company });
  }

  const docMap = {};
  for (const r of rows ?? []) docMap[r.id] = r.name;

  return (rows ?? []).map(r => ({
    ...r,
    _stats:  statMap[r.id] ?? { count: 0, responses: 0, lastUsed: null },
    _pairs:  (r.type === "cover_letter" ? clPairs[r.id] : resumePairs[r.id]) ?? [],
    _docMap: docMap,
  }));
}

export function useResumes() {
  const [resumes,   setResumes]   = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchResumesWithStats().then(setResumes);
  }, []);

  async function uploadResume(file, type = "resume") {
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const id   = crypto.randomUUID();
    const path = `${user.id}/${id}.pdf`;

    const { error: storageErr } = await supabase.storage
      .from("resumes")
      .upload(path, file, { contentType: "application/pdf" });

    if (storageErr) { console.error("storage upload failed:", storageErr); setUploading(false); return; }

    const name = file.name.replace(/\.pdf$/i, "");
    const { data: row, error: dbErr } = await supabase
      .from("resumes")
      .insert({ id, name, file_path: path, type })
      .select()
      .single();

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
