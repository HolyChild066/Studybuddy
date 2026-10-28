-- StudyMate — initial schema, constraints, RLS, and mutual-match trigger.
-- Run this in the Supabase SQL editor (or `supabase db push`).
--
-- Safety rules enforced here, not in the UI:
--   * messages has no free-text body column
--   * in-person sessions must be at the University Library
--   * in-person sessions require safety_acknowledged = true
--   * blocked pairs cannot read/write messages or sessions
--   * users cannot see who passed on them
--   * decisions are the only way a match can be created (no direct inserts)

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.verification_status as enum ('none', 'pending', 'approved', 'rejected');
create type public.study_pref as enum ('online', 'in_person', 'either');
create type public.subject_kind as enum ('can_help', 'need_help', 'want_study');
create type public.decision_action as enum ('pass', 'study');
create type public.session_mode as enum ('online', 'in_person');
create type public.session_status as enum ('proposed', 'confirmed', 'completed', 'cancelled');
create type public.report_reason as enum (
  'harassment', 'spam', 'inappropriate', 'fake_identity', 'academic_misconduct', 'other'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  email text not null unique,
  course text not null,
  year smallint not null check (year between 1 and 6),
  bio text not null default '' check (char_length(bio) <= 160),
  study_pref public.study_pref not null default 'either',
  avatar_color text not null default '#3B4FE0',
  university text not null default 'Northbridge University'
    check (university = 'Northbridge University'),
  verification public.verification_status not null default 'none',
  created_at timestamptz not null default now()
);

create table public.subjects (
  id text primary key,
  code text not null unique,
  name text not null,
  active boolean not null default true
);

create table public.profile_subjects (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  subject_id text not null references public.subjects (id),
  kind public.subject_kind not null,
  primary key (profile_id, subject_id, kind)
);

create table public.availability (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  day smallint not null check (day between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);

create table public.decisions (
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  target_id uuid not null references public.profiles (id) on delete cascade,
  action public.decision_action not null,
  created_at timestamptz not null default now(),
  primary key (viewer_id, target_id),
  check (viewer_id <> target_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);

create table public.message_templates (
  key text primary key,
  category text not null,
  emoji text not null,
  template_text text not null,
  placeholders text[] not null default '{}',
  active boolean not null default true
);

-- No `body` column: chat is template-only by construction.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  template_key text not null references public.message_templates (key),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now()
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  subject_id text not null references public.subjects (id),
  created_by uuid not null references public.profiles (id) on delete cascade,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  mode public.session_mode not null,
  location text not null,
  status public.session_status not null default 'proposed',
  safety_acknowledged boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  check (
    (mode = 'online' and location = 'Online')
    or (mode = 'in_person' and location = 'University Library')
  ),
  check (mode = 'online' or safety_acknowledged)
);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- Snapshot columns mean moderation never needs live read access to messages.
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  message_id uuid,
  message_text text,
  message_category text,
  reason public.report_reason not null,
  note text check (char_length(note) <= 500),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved')),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);

create table public.verifications (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  student_id_number text not null check (char_length(student_id_number) between 4 and 40),
  status public.verification_status not null default 'pending',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index decisions_target_idx on public.decisions (target_id);
create index messages_match_created_idx on public.messages (match_id, created_at);
create index sessions_match_idx on public.study_sessions (match_id);
create index availability_profile_idx on public.availability (profile_id);
create index profile_subjects_subject_idx on public.profile_subjects (subject_id);
create index reports_status_idx on public.reports (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER so RLS policies can check the other side)
-- ---------------------------------------------------------------------------
create or replace function public.is_blocked(a uuid, b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function public.is_match_participant(match uuid, uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.matches
    where id = match and (user_a = uid or user_b = uid)
  );
$$;

create or replace function public.match_is_blocked(match uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.matches m
    where m.id = match and public.is_blocked(m.user_a, m.user_b)
  );
$$;

-- Safe, read-only projection of another student. No email, no verification docs.
create view public.public_profiles as
select
  p.id,
  p.name,
  p.course,
  p.year,
  p.bio,
  p.study_pref,
  p.avatar_color,
  p.university
from public.profiles p
where p.verification = 'approved';

-- ---------------------------------------------------------------------------
-- Profile auto-creation from Supabase Auth
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, course, year)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), 'New Student'),
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'course', ''), 'BS Information Technology'),
    coalesce((new.raw_user_meta_data ->> 'year')::smallint, 1)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Mutual match: both decisions must be 'study'. Duplicate pairs are impossible.
-- ---------------------------------------------------------------------------
create or replace function public.handle_study_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  a uuid;
  b uuid;
begin
  if new.action <> 'study' then
    return new;
  end if;

  if exists (
    select 1
    from public.decisions d
    where d.viewer_id = new.target_id
      and d.target_id = new.viewer_id
      and d.action = 'study'
  ) then
    a := least(new.viewer_id, new.target_id);
    b := greatest(new.viewer_id, new.target_id);

    insert into public.matches (user_a, user_b)
    values (a, b)
    on conflict (user_a, user_b) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_study_decision
after insert or update of action on public.decisions
for each row execute function public.handle_study_decision();

-- Sessions are immutable except for status.
create or replace function public.guard_session_update()
returns trigger
language plpgsql
as $$
begin
  if new.match_id <> old.match_id
     or new.subject_id <> old.subject_id
     or new.created_by <> old.created_by
     or new.session_date <> old.session_date
     or new.start_time <> old.start_time
     or new.end_time <> old.end_time
     or new.mode <> old.mode
     or new.location <> old.location
     or new.safety_acknowledged <> old.safety_acknowledged then
    raise exception 'Only session status can be updated';
  end if;
  return new;
end;
$$;

create trigger guard_session_update
before update on public.study_sessions
for each row execute function public.guard_session_update();

-- ---------------------------------------------------------------------------
-- Column privileges: students can never self-approve verification.
-- ---------------------------------------------------------------------------
revoke update on public.profiles from authenticated, anon;
grant update (name, course, year, bio, study_pref, avatar_color)
  on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.profile_subjects enable row level security;
alter table public.availability enable row level security;
alter table public.decisions enable row level security;
alter table public.matches enable row level security;
alter table public.message_templates enable row level security;
alter table public.messages enable row level security;
alter table public.study_sessions enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.verifications enable row level security;

-- profiles: own row only. Others come from public_profiles.
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- subjects + templates: readable catalogues, no writes from the app.
create policy subjects_read on public.subjects
  for select using (active);
create policy templates_read on public.message_templates
  for select using (active);

-- profile_subjects / availability: own writes, read for approved peers.
create policy profile_subjects_read on public.profile_subjects
  for select using (
    profile_id = auth.uid()
    or exists (select 1 from public.public_profiles pp where pp.id = profile_id)
  );
create policy profile_subjects_write on public.profile_subjects
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy availability_read on public.availability
  for select using (
    profile_id = auth.uid()
    or exists (select 1 from public.public_profiles pp where pp.id = profile_id)
  );
create policy availability_write on public.availability
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- decisions: you may only write your own, and never see who passed on you.
create policy decisions_select_own on public.decisions
  for select using (viewer_id = auth.uid());
create policy decisions_insert_own on public.decisions
  for insert with check (
    viewer_id = auth.uid()
    and not public.is_blocked(viewer_id, target_id)
    and exists (select 1 from public.public_profiles pp where pp.id = target_id)
  );

-- matches: participants only; inserts happen through the trigger above.
create policy matches_select_participant on public.matches
  for select using (auth.uid() in (user_a, user_b));

-- messages: participants only, blocked pairs lose access, writes are template-only.
create policy messages_select_participant on public.messages
  for select using (
    public.is_match_participant(match_id, auth.uid())
    and not public.match_is_blocked(match_id)
  );
create policy messages_insert_participant on public.messages
  for insert with check (
    sender_id = auth.uid()
    and public.is_match_participant(match_id, auth.uid())
    and not public.match_is_blocked(match_id)
    and exists (
      select 1 from public.message_templates t
      where t.key = template_key and t.active
    )
  );

-- sessions
create policy sessions_select_participant on public.study_sessions
  for select using (
    public.is_match_participant(match_id, auth.uid())
    and not public.match_is_blocked(match_id)
  );
create policy sessions_insert_participant on public.study_sessions
  for insert with check (
    created_by = auth.uid()
    and public.is_match_participant(match_id, auth.uid())
    and not public.match_is_blocked(match_id)
  );
create policy sessions_update_participant on public.study_sessions
  for update using (
    public.is_match_participant(match_id, auth.uid())
    and not public.match_is_blocked(match_id)
  ) with check (
    public.is_match_participant(match_id, auth.uid())
    and not public.match_is_blocked(match_id)
  );

-- blocks: own only.
create policy blocks_select_own on public.blocks
  for select using (blocker_id = auth.uid());
create policy blocks_insert_own on public.blocks
  for insert with check (blocker_id = auth.uid());
create policy blocks_delete_own on public.blocks
  for delete using (blocker_id = auth.uid());

-- reports: write-only for students; reviewed in the dashboard.
create policy reports_insert_own on public.reports
  for insert with check (reporter_id = auth.uid());

-- verifications: submit your own, read your own, review via dashboard.
create policy verifications_select_own on public.verifications
  for select using (profile_id = auth.uid());
create policy verifications_insert_own on public.verifications
  for insert with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.public_profiles to authenticated;
grant select on public.subjects, public.message_templates to authenticated;
grant select, insert, update, delete on public.profile_subjects, public.availability to authenticated;
grant select, insert on public.decisions to authenticated;
grant select on public.matches to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert, update on public.study_sessions to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant insert on public.reports to authenticated;
grant select, insert on public.verifications to authenticated;
grant select, insert on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.study_sessions;
alter publication supabase_realtime add table public.matches;
