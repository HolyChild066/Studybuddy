-- StudyMate — peer feedback (§12) and learning progress (§13).
-- Run this in the Supabase SQL editor (or `supabase db push`).

-- ---------------------------------------------------------------------------
-- Peer feedback: one rating per (session, reviewer). Concerns snapshot at write time.
-- ---------------------------------------------------------------------------
create table public.peer_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewed_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  tags text[] not null default '{}',
  note text,
  concern text,
  concern_note text,
  created_at timestamptz not null default now(),
  unique (session_id, reviewer_id)
);

create index peer_feedback_reviewer_idx on public.peer_feedback (reviewer_id);
create index peer_feedback_reviewed_idx on public.peer_feedback (reviewed_id);
create index peer_feedback_session_idx on public.peer_feedback (session_id);

-- ---------------------------------------------------------------------------
-- Learning progress: per (profile, subject). Upserted after each completed session.
-- ---------------------------------------------------------------------------
create table public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  subject_id text not null references public.subjects (id),
  topics jsonb not null default '[]'::jsonb,
  confidence_before smallint,
  confidence_after smallint,
  sessions_completed integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (profile_id, subject_id)
);

create index learning_progress_profile_idx on public.learning_progress (profile_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.peer_feedback enable row level security;
alter table public.learning_progress enable row level security;

-- Feedback: you may only write your own; you may read your own + what others gave you.
create policy peer_feedback_insert_own on public.peer_feedback
  for insert with check (reviewer_id = auth.uid());

create policy peer_feedback_select_own on public.peer_feedback
  for select using (
    reviewer_id = auth.uid()
    or reviewed_id = auth.uid()
    or public.is_match_participant(match_id, auth.uid())
  );

-- Learning progress: own rows only.
create policy learning_progress_own on public.learning_progress
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert on public.peer_feedback to authenticated;
grant select, insert, update, delete on public.learning_progress to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.peer_feedback;
alter publication supabase_realtime add table public.learning_progress;