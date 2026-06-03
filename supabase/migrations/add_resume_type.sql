-- Run once in the Supabase SQL editor
alter table resumes add column if not exists type text not null default 'resume';
