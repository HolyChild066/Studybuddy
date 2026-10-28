-- StudyMate seed data: one campus subject catalogue + the guided prompt catalogue.
-- Safe to re-run.

insert into public.subjects (id, code, name) values
  ('it101',   'IT 101',   'Introduction to Computing'),
  ('it102',   'IT 102',   'Programming 1'),
  ('it103',   'IT 103',   'Data Structures'),
  ('it203',   'IT 203',   'Database Systems'),
  ('it204',   'IT 204',   'Web Development'),
  ('it205',   'IT 205',   'Information Management'),
  ('math101', 'MATH 101', 'Calculus 1'),
  ('ge101',   'GE 101',   'Understanding the Self')
on conflict (id) do update
  set code = excluded.code,
      name = excluded.name,
      active = true;

-- template_text holds the prompt. Students never submit arbitrary text:
-- messages.template_key references this table and messages has no body column.
insert into public.message_templates (key, category, emoji, template_text, placeholders) values
  -- Introduction
  ('hi',              'introduction', '👋', $t$Hi! Nice to meet you.$t$, '{}'),
  ('like_study',      'introduction', '📚', $t$I'd like to study together.$t$, '{}'),
  ('glad_matched',    'introduction', '🤝', $t$Glad we matched!$t$, '{}'),
  ('ask_subject',     'introduction', '❓', $t$What subject would you like to study?$t$, '{}'),
  ('study_subject',   'introduction', '📚', $t$Let's focus on {subject}.$t$, '{subject}'),

  -- Help request
  ('can_help_me',     'help_request', '❓', $t$Can you help me with this subject?$t$, '{}'),
  ('help_subject',    'help_request', '❓', $t$Can you help me with {subject}?$t$, '{subject}'),
  ('need_help_topic', 'help_request', '📚', $t$I'd like some help with this topic.$t$, '{}'),
  ('difficulty',      'help_request', '📝', $t$I'm having difficulty understanding this subject.$t$, '{}'),
  ('explain_topic',   'help_request', '💡', $t$Could you explain this topic to me?$t$, '{}'),

  -- Offering help
  ('can_help',        'offering_help', '🙋', $t$I can help you with this subject.$t$, '{}'),
  ('can_help_subject','offering_help', '🙋', $t$I can help you with {subject}.$t$, '{subject}'),
  ('happy_study',     'offering_help', '📚', $t$I'd be happy to study this with you.$t$, '{}'),
  ('can_explain',     'offering_help', '💡', $t$I can explain what I know about this topic.$t$, '{}'),

  -- Study together
  ('would_study',     'study_together', '📚', $t$Would you like to study together?$t$, '{}'),
  ('lets_study',      'study_together', '🤝', $t$Let's study together.$t$, '{}'),
  ('review_together', 'study_together', '📝', $t$Let's review this subject together.$t$, '{}'),

  -- Availability
  ('when_available',  'availability', '🕐', $t$When are you available?$t$, '{}'),
  ('morning',         'availability', '🌅', $t$Are you available in the morning?$t$, '{}'),
  ('afternoon',       'availability', '☀️', $t$Are you available in the afternoon?$t$, '{}'),
  ('evening',         'availability', '🌙', $t$Are you available in the evening?$t$, '{}'),
  ('my_slot',         'availability', '🕐', $t$I'm free {slot}.$t$, '{slot}'),

  -- Study mode
  ('prefer_online',   'study_mode', '💻', $t$I'd prefer to study online.$t$, '{}'),
  ('prefer_in_person','study_mode', '🏫', $t$I'd prefer to study in person.$t$, '{}'),
  ('either_mode',     'study_mode', '🔄', $t$Either option works for me.$t$, '{}'),

  -- Study session
  ('schedule_session','study_session', '📅', $t$Let's schedule a study session.$t$, '{}'),
  ('does_time_work',  'study_session', '⏰', $t$Does this time work for you?$t$, '{session}'),
  ('what_study',      'study_session', '📚', $t$What should we study?$t$, '{}'),
  ('running_late',    'study_session', '⏰', $t$Running a few minutes late.$t$, '{}'),
  ('on_my_way',       'study_session', '🏃', $t$On my way!$t$, '{}'),
  ('thanks_session',  'study_session', '🙏', $t$Thanks for the session — that really helped!$t$, '{}'),

  -- Confirmation
  ('sounds_good',     'confirmation', '✅', $t$Sounds good!$t$, '{}'),
  ('works_for_me',    'confirmation', '👍', $t$That works for me.$t$, '{}'),
  ('see_you',         'confirmation', '🎉', $t$See you then!$t$, '{}'),
  ('ready',           'confirmation', '📚', $t$I'll be ready for our study session.$t$, '{}'),

  -- Rescheduling
  ('cant_make',       'rescheduling', '❌', $t$I can't make it at that time.$t$, '{}'),
  ('another_time',    'rescheduling', '🕐', $t$Can we choose another time?$t$, '{}'),
  ('reschedule',      'rescheduling', '📅', $t$Can we reschedule?$t$, '{}')
on conflict (key) do update
  set category = excluded.category,
      emoji = excluded.emoji,
      template_text = excluded.template_text,
      placeholders = excluded.placeholders,
      active = true;
