-- HPBOX database schema for Supabase/PostgreSQL.
-- Run this file in the Supabase SQL Editor after creating the project.

create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.user_role as enum ('athlete', 'coach', 'admin');
create type public.gender_type as enum ('F', 'M');
create type public.workout_part_kind as enum ('warmup', 'strength', 'metcon', 'coach_notes');
create type public.score_type as enum ('time', 'reps', 'load', 'complex', 'rounds', 'complete');
create type public.pr_type as enum (
  'load',
  'one_rm',
  'three_rm',
  'five_rm',
  'max_reps',
  'benchmark_time',
  'benchmark_score'
);
create type public.result_part as enum ('strength', 'metcon');
create type public.reaction_type as enum ('like', 'parabens');
create type public.attendance_status as enum ('booked', 'present', 'absent', 'cancelled');
create type public.unlock_method as enum ('pin', 'qr', 'master_pin', 'manual_admin', 'manual_coach');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique,
  full_name text not null,
  role public.user_role not null default 'athlete',
  gender public.gender_type,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_gender_required_for_athletes
    check ((role = 'athlete' and gender is not null) or (role <> 'athlete'))
);

create table public.profile_private (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  email text,
  phone text,
  admin_notes text,
  updated_at timestamptz not null default now()
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  workout_date date not null unique,
  title text not null,
  published boolean not null default true,
  unlock_time time not null default '20:00',
  force_unlocked boolean not null default false,
  access_code text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_parts (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  part_kind public.workout_part_kind not null,
  content text not null default '',
  score_type public.score_type,
  movement text,
  pr_type public.pr_type,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_id, part_kind)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  workout_date date not null,
  starts_at time not null,
  ends_at time not null,
  access_code text,
  code_valid_from time generated always as (ends_at - interval '15 minutes') stored,
  code_valid_until time generated always as (ends_at + interval '10 minutes') stored,
  recurring boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint classes_end_after_start check (ends_at > starts_at)
);

create table public.class_attendance (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  status public.attendance_status not null default 'booked',
  marked_by uuid references public.profiles(id),
  marked_at timestamptz not null default now(),
  unique (class_id, athlete_id)
);

create table public.athlete_workout_unlocks (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  method public.unlock_method not null,
  unlocked_at timestamptz not null default now(),
  unique (athlete_id, workout_id)
);

create table public.master_pins (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  workout_date date not null,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  code text not null,
  used boolean not null default false,
  used_by uuid references public.profiles(id),
  used_at timestamptz,
  expires_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint master_pins_code_format check (code ~ '^[0-9]{6}$')
);

create table public.results (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  part public.result_part not null,
  score text not null,
  score_numeric numeric,
  level text,
  movement text,
  pr_type public.pr_type,
  pr_value text,
  strength_sets jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (athlete_id, workout_id, part)
);

create table public.prs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  source_result_id uuid references public.results(id) on delete set null,
  movement text not null,
  pr_type public.pr_type not null,
  value_numeric numeric,
  raw_value text not null,
  unit text,
  achieved_on date not null,
  created_at timestamptz not null default now()
);

create table public.result_reactions (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references public.results(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction public.reaction_type not null,
  created_at timestamptz not null default now(),
  unique (result_id, user_id, reaction)
);

create table public.result_comments (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references public.results(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint result_comments_body_not_blank check (length(trim(body)) > 0)
);

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint community_posts_body_not_blank check (length(trim(body)) > 0)
);

create index results_workout_part_idx on public.results (workout_id, part);
create index results_athlete_idx on public.results (athlete_id, created_at desc);
create index prs_athlete_movement_idx on public.prs (athlete_id, movement, pr_type, achieved_on desc);
create index comments_result_idx on public.result_comments (result_id, created_at);
create index reactions_result_idx on public.result_reactions (result_id);
create index classes_date_idx on public.classes (workout_date, starts_at);
create unique index master_pins_active_code_idx on public.master_pins (code) where used = false;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger profile_private_set_updated_at
before update on public.profile_private
for each row execute function public.set_updated_at();

create trigger workouts_set_updated_at
before update on public.workouts
for each row execute function public.set_updated_at();

create trigger workout_parts_set_updated_at
before update on public.workout_parts
for each row execute function public.set_updated_at();

create trigger classes_set_updated_at
before update on public.classes
for each row execute function public.set_updated_at();

create trigger master_pins_set_updated_at
before update on public.master_pins
for each row execute function public.set_updated_at();

create trigger results_set_updated_at
before update on public.results
for each row execute function public.set_updated_at();

create trigger result_comments_set_updated_at
before update on public.result_comments
for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('coach', 'admin'), false)
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.is_workout_visible_to_user(target_workout_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workouts w
    where w.id = target_workout_id
      and w.published = true
      and (
        public.is_staff()
        or w.force_unlocked = true
        or extract(isodow from w.workout_date) in (6, 7)
        or now() >= ((w.workout_date::timestamp + w.unlock_time) at time zone 'Europe/Lisbon')
        or exists (
          select 1
          from public.athlete_workout_unlocks u
          where u.workout_id = w.id
            and u.athlete_id = target_user_id
        )
      )
  )
$$;

create or replace function public.can_view_result(target_result_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.results r
    where r.id = target_result_id
      and (
        r.athlete_id = target_user_id
        or public.is_staff()
        or public.is_workout_visible_to_user(r.workout_id, target_user_id)
      )
  )
$$;

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_parts enable row level security;
alter table public.classes enable row level security;
alter table public.class_attendance enable row level security;
alter table public.athlete_workout_unlocks enable row level security;
alter table public.master_pins enable row level security;
alter table public.results enable row level security;
alter table public.prs enable row level security;
alter table public.result_reactions enable row level security;
alter table public.result_comments enable row level security;
alter table public.community_posts enable row level security;

create policy "profiles readable by logged users"
on public.profiles for select
to authenticated
using (true);

create policy "admin updates profiles"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admin inserts profiles"
on public.profiles for insert
to authenticated
with check (public.is_admin());

create policy "profile private visible to owner or staff"
on public.profile_private for select
to authenticated
using (profile_id = auth.uid() or public.is_staff());

create policy "profile private editable by owner or admin"
on public.profile_private for all
to authenticated
using (profile_id = auth.uid() or public.is_admin())
with check (profile_id = auth.uid() or public.is_admin());

create policy "workouts readable by staff or when visible"
on public.workouts for select
to authenticated
using (public.is_staff() or public.is_workout_visible_to_user(id, auth.uid()));

create policy "staff manages workouts"
on public.workouts for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy "workout parts readable by staff or visible athlete parts"
on public.workout_parts for select
to authenticated
using (
  public.is_staff()
  or (
    part_kind <> 'coach_notes'
    and public.is_workout_visible_to_user(workout_id, auth.uid())
  )
);

create policy "staff manages workout parts"
on public.workout_parts for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy "classes readable by staff"
on public.classes for select
to authenticated
using (public.is_staff());

create policy "staff manages classes"
on public.classes for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy "attendance visible to staff or own athlete"
on public.class_attendance for select
to authenticated
using (public.is_staff() or athlete_id = auth.uid());

create policy "staff manages attendance"
on public.class_attendance for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy "unlock visible to owner or staff"
on public.athlete_workout_unlocks for select
to authenticated
using (athlete_id = auth.uid() or public.is_staff());

create policy "athlete creates own unlock or staff creates any"
on public.athlete_workout_unlocks for insert
to authenticated
with check (athlete_id = auth.uid() or public.is_staff());

create policy "master pins visible to staff"
on public.master_pins for select
to authenticated
using (public.is_staff());

create policy "staff manages master pins"
on public.master_pins for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create or replace function public.redeem_master_pin(pin_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  pin public.master_pins%rowtype;
  clean_code text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  clean_code := regexp_replace(coalesce(pin_code, ''), '\D', '', 'g');

  select *
  into pin
  from public.master_pins
  where code = clean_code
    and athlete_id = auth.uid()
    and used = false
    and workout_date = ((now() at time zone 'Europe/Lisbon')::date)
    and (expires_at is null or expires_at > now())
  limit 1
  for update;

  if not found then
    raise exception 'invalid_master_pin';
  end if;

  update public.master_pins
  set used = true,
      used_by = auth.uid(),
      used_at = now(),
      updated_at = now()
  where id = pin.id;

  insert into public.athlete_workout_unlocks (athlete_id, workout_id, method)
  values (auth.uid(), pin.workout_id, 'master_pin')
  on conflict (athlete_id, workout_id)
  do update set method = excluded.method,
                unlocked_at = now();

  return pin.workout_id;
end;
$$;

grant execute on function public.redeem_master_pin(text) to authenticated;

create policy "results readable after workout is visible"
on public.results for select
to authenticated
using (
  athlete_id = auth.uid()
  or public.is_staff()
  or public.is_workout_visible_to_user(workout_id, auth.uid())
);

create policy "athletes insert own visible results"
on public.results for insert
to authenticated
with check (
  athlete_id = auth.uid()
  and public.is_workout_visible_to_user(workout_id, auth.uid())
);

create policy "athletes update own results or staff manages"
on public.results for update
to authenticated
using (athlete_id = auth.uid() or public.is_staff())
with check (athlete_id = auth.uid() or public.is_staff());

create policy "admin deletes results"
on public.results for delete
to authenticated
using (public.is_admin());

create policy "prs visible to owner or staff"
on public.prs for select
to authenticated
using (athlete_id = auth.uid() or public.is_staff());

create policy "athletes insert own prs or staff manages"
on public.prs for insert
to authenticated
with check (athlete_id = auth.uid() or public.is_staff());

create policy "athletes update own prs or staff manages"
on public.prs for update
to authenticated
using (athlete_id = auth.uid() or public.is_staff())
with check (athlete_id = auth.uid() or public.is_staff());

create policy "admin deletes prs"
on public.prs for delete
to authenticated
using (public.is_admin());

create policy "reactions readable by logged users"
on public.result_reactions for select
to authenticated
using (public.can_view_result(result_id, auth.uid()));

create policy "users manage own reactions"
on public.result_reactions for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and public.can_view_result(result_id, auth.uid()));

create policy "comments readable by logged users"
on public.result_comments for select
to authenticated
using (public.can_view_result(result_id, auth.uid()));

create policy "users create own comments"
on public.result_comments for insert
to authenticated
with check (user_id = auth.uid() and public.can_view_result(result_id, auth.uid()));

create policy "users update own comments or staff manages"
on public.result_comments for update
to authenticated
using (user_id = auth.uid() or public.is_staff())
with check (user_id = auth.uid() or public.is_staff());

create policy "users delete own comments or staff manages"
on public.result_comments for delete
to authenticated
using (user_id = auth.uid() or public.is_staff());

create policy "community posts readable by logged users"
on public.community_posts for select
to authenticated
using (true);

create policy "users create own community posts"
on public.community_posts for insert
to authenticated
with check (user_id = auth.uid());

create policy "users update own community posts or staff manages"
on public.community_posts for update
to authenticated
using (user_id = auth.uid() or public.is_staff())
with check (user_id = auth.uid() or public.is_staff());

create policy "users delete own community posts or staff manages"
on public.community_posts for delete
to authenticated
using (user_id = auth.uid() or public.is_staff());
