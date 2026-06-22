-- HPBOX pilot online state.
-- Use this file for the quick real-life pilot.
-- It stores the current app state in one shared JSON document.
--
-- Important: this is for a controlled pilot only.
-- Anyone with the published app link can read/write this shared pilot state.
-- For production, use the normalized schema with Supabase Auth and RLS per user.

create table if not exists public.hpbox_pilot_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.hpbox_pilot_state enable row level security;

drop policy if exists "hpbox pilot can read shared state" on public.hpbox_pilot_state;
drop policy if exists "hpbox pilot can insert shared state" on public.hpbox_pilot_state;
drop policy if exists "hpbox pilot can update shared state" on public.hpbox_pilot_state;

create policy "hpbox pilot can read shared state"
on public.hpbox_pilot_state for select
to anon, authenticated
using (id = 'hpbox-pilot');

create policy "hpbox pilot can insert shared state"
on public.hpbox_pilot_state for insert
to anon, authenticated
with check (id = 'hpbox-pilot');

create policy "hpbox pilot can update shared state"
on public.hpbox_pilot_state for update
to anon, authenticated
using (id = 'hpbox-pilot')
with check (id = 'hpbox-pilot');

insert into public.hpbox_pilot_state (id, payload)
values ('hpbox-pilot', '{}'::jsonb)
on conflict (id) do nothing;
