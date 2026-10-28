-- Seed demo auth users so the app can be tested with Supabase.
-- Run AFTER 202610280001_init.sql and seed.sql.
-- Password for all demo accounts: demo1234
-- Uses bcrypt hashing compatible with Supabase Auth.

-- Helper to create an auth user with a known password.
-- We insert into auth.users with the required columns.
do $$
declare
  alex_id uuid := '11111111-1111-1111-1111-111111111111';
  jamie_id uuid := '22222222-2222-2222-2222-222222222222';
  maria_id uuid := '33333333-3333-3333-3333-333333333333';
  sam_id uuid := '44444444-4444-4444-4444-444444444444';
  pwd_hash text;
begin
  pwd_hash := crypt('demo1234', gen_salt('bf'));

  -- Alex
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, role, aud)
  values (alex_id, '00000000-0000-0000-0000-000000000000', 'alex@northbridge.edu', pwd_hash, now(),
    '{"name":"Alex Morgan","course":"BS Information Technology","year":2}'::jsonb, now(), now(), 'authenticated', 'authenticated')
  on conflict (id) do nothing;

  -- Jamie
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, role, aud)
  values (jamie_id, '00000000-0000-0000-0000-000000000000', 'jamie@northbridge.edu', pwd_hash, now(),
    '{"name":"Jamie Cruz","course":"BS Information Technology","year":2}'::jsonb, now(), now(), 'authenticated', 'authenticated')
  on conflict (id) do nothing;

  -- Maria
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, role, aud)
  values (maria_id, '00000000-0000-0000-0000-000000000000', 'maria@northbridge.edu', pwd_hash, now(),
    '{"name":"Maria Santos","course":"BS Computer Science","year":2}'::jsonb, now(), now(), 'authenticated', 'authenticated')
  on conflict (id) do nothing;

  -- Sam
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, role, aud)
  values (sam_id, '00000000-0000-0000-0000-000000000000', 'sam@northbridge.edu', pwd_hash, now(),
    '{"name":"Sam Rivera","course":"BS Information Systems","year":2}'::jsonb, now(), now(), 'authenticated', 'authenticated')
  on conflict (id) do nothing;
end $$;

-- Set profiles to approved (handle_new_user trigger creates them as 'none')
update public.profiles set verification = 'approved', bio = 'Second-year IT student. I like breaking code down until it finally clicks.', study_pref = 'either', avatar_color = '#3B4FE0' where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set verification = 'approved', bio = 'Databases make sense to me. Java does not. Let us trade notes.', study_pref = 'either', avatar_color = '#FF5A4F' where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set verification = 'approved', bio = 'I tutor ER diagrams at the library on Mondays. Bring your messy schema.', study_pref = 'in_person', avatar_color = '#12B76A' where id = '33333333-3333-3333-3333-333333333333';
update public.profiles set verification = 'approved', bio = 'Normalization, transactions, and quiet corners of the library.', study_pref = 'online', avatar_color = '#8B5CF6' where id = '44444444-4444-4444-4444-444444444444';

-- Seed subjects (matching the local demo data)
insert into public.profile_subjects (profile_id, subject_id, kind) values
  ('11111111-1111-1111-1111-111111111111', 'it102', 'can_help'),
  ('11111111-1111-1111-1111-111111111111', 'it103', 'can_help'),
  ('11111111-1111-1111-1111-111111111111', 'it203', 'need_help'),
  ('11111111-1111-1111-1111-111111111111', 'it204', 'want_study'),
  ('22222222-2222-2222-2222-222222222222', 'it203', 'can_help'),
  ('22222222-2222-2222-2222-222222222222', 'it102', 'need_help'),
  ('22222222-2222-2222-2222-222222222222', 'it205', 'want_study'),
  ('33333333-3333-3333-3333-333333333333', 'it203', 'can_help'),
  ('33333333-3333-3333-3333-333333333333', 'it204', 'need_help'),
  ('33333333-3333-3333-3333-333333333333', 'math101', 'can_help'),
  ('44444444-4444-4444-4444-444444444444', 'it203', 'can_help'),
  ('44444444-4444-4444-4444-444444444444', 'math101', 'need_help'),
  ('44444444-4444-4444-4444-444444444444', 'it101', 'want_study')
on conflict do nothing;

-- Seed availability
insert into public.availability (profile_id, day, start_time, end_time) values
  ('11111111-1111-1111-1111-111111111111', 1, '18:00', '21:00'),
  ('11111111-1111-1111-1111-111111111111', 3, '18:00', '21:00'),
  ('11111111-1111-1111-1111-111111111111', 6, '09:00', '12:00'),
  ('22222222-2222-2222-2222-222222222222', 2, '18:00', '21:00'),
  ('22222222-2222-2222-2222-222222222222', 4, '18:00', '21:00'),
  ('22222222-2222-2222-2222-222222222222', 6, '09:00', '12:00'),
  ('33333333-3333-3333-3333-333333333333', 1, '17:00', '20:00'),
  ('33333333-3333-3333-3333-333333333333', 3, '17:00', '20:00'),
  ('44444444-4444-4444-4444-444444444444', 2, '19:00', '22:00'),
  ('44444444-4444-4444-4444-444444444444', 5, '14:00', '17:00')
on conflict do nothing;

-- Seed Jamie's study decision on Alex (so mutual match works on first tap)
insert into public.decisions (viewer_id, target_id, action) values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'study')
on conflict (viewer_id, target_id) do nothing;