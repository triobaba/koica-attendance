create extension if not exists pgcrypto;

create table if not exists public.participants (
  program_id text primary key check (program_id ~ '^KYLP[0-9]+$'),
  full_name text not null,
  country text not null,
  first_seen_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  program_id text not null references public.participants(program_id) on delete cascade,
  attendance_date date not null,
  checked_in_at timestamptz not null default now(),
  source text not null check (source in ('vision', 'manual', 'offline')),
  edited_before_confirm boolean not null default false,
  unique (program_id, attendance_date)
);

create table if not exists public.participant_conflicts (
  id uuid primary key default gen_random_uuid(),
  program_id text not null references public.participants(program_id) on delete cascade,
  submitted_name text not null,
  submitted_country text not null,
  created_at timestamptz not null default now()
);

create index if not exists attendance_date_idx on public.attendance(attendance_date);
create index if not exists participant_country_idx on public.participants(country);

alter table public.participants enable row level security;
alter table public.attendance enable row level security;
alter table public.participant_conflicts enable row level security;

drop policy if exists participants_read on public.participants;
create policy participants_read on public.participants
for select to anon
using (true);

drop policy if exists participants_insert on public.participants;
create policy participants_insert on public.participants
for insert to anon
with check (true);

drop policy if exists attendance_read on public.attendance;
create policy attendance_read on public.attendance
for select to anon
using (true);

drop policy if exists attendance_insert on public.attendance;
create policy attendance_insert on public.attendance
for insert to anon
with check (true);

drop policy if exists attendance_update on public.attendance;
create policy attendance_update on public.attendance
for update to anon
using (true)
with check (true);

drop policy if exists conflicts_insert on public.participant_conflicts;
create policy conflicts_insert on public.participant_conflicts
for insert to anon
with check (true);
