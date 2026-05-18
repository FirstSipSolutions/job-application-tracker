-- Run once in the Supabase SQL editor
alter table applications
  add column if not exists cover_letter_id uuid references resumes(id);
