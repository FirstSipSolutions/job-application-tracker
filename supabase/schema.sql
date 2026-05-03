-- ============================================================
-- Run this once in the Supabase SQL editor
-- Project: Job Application Tracker
-- ============================================================


-- ── Applications ────────────────────────────────────────────

create table if not exists applications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null default auth.uid(),
  company    text not null,
  role       text not null,
  status     text not null default 'Applied',
  date       date not null,
  url        text,
  notes      text,
  created_at timestamptz default now()
);

alter table applications enable row level security;

create policy "Users manage own applications" on applications
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── Events ──────────────────────────────────────────────────

create table if not exists events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null default auth.uid(),
  date       date not null,
  type       text not null,
  label      text not null,
  created_at timestamptz default now()
);

alter table events enable row level security;

create policy "Users manage own events" on events
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
