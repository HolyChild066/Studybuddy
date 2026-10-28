import type {
  ChatMessage,
  ConversationStage,
  MessageCategory,
  MessageTemplate,
  PlaceholderType,
  StudySession,
} from './types';

export const CATEGORY_META: Record<
  MessageCategory,
  { label: string; emoji: string }
> = {
  introduction: { label: 'Introduction', emoji: '👋' },
  help_request: { label: 'Help request', emoji: '❓' },
  offering_help: { label: 'Offering help', emoji: '🙋' },
  study_together: { label: 'Study together', emoji: '📚' },
  availability: { label: 'Availability', emoji: '🕐' },
  study_mode: { label: 'Study mode', emoji: '💻' },
  study_session: { label: 'Study session', emoji: '📅' },
  confirmation: { label: 'Confirmation', emoji: '✅' },
  rescheduling: { label: 'Rescheduling', emoji: '🔄' },
};

export const CATEGORY_ORDER: MessageCategory[] = [
  'introduction',
  'help_request',
  'offering_help',
  'study_together',
  'availability',
  'study_mode',
  'study_session',
  'confirmation',
  'rescheduling',
];

export const TEMPLATES: MessageTemplate[] = [
  // Introduction
  { key: 'hi', category: 'introduction', emoji: '👋', text: 'Hi! Nice to meet you.', placeholders: [] },
  { key: 'like_study', category: 'introduction', emoji: '📚', text: "I'd like to study together.", placeholders: [] },
  { key: 'glad_matched', category: 'introduction', emoji: '🤝', text: 'Glad we matched!', placeholders: [] },
  { key: 'ask_subject', category: 'introduction', emoji: '❓', text: 'What subject would you like to study?', placeholders: [] },
  { key: 'study_subject', category: 'introduction', emoji: '📚', text: "Let's focus on {subject}.", placeholders: ['subject'] },

  // Help request
  { key: 'can_help_me', category: 'help_request', emoji: '❓', text: 'Can you help me with this subject?', placeholders: [] },
  { key: 'help_subject', category: 'help_request', emoji: '❓', text: 'Can you help me with {subject}?', placeholders: ['subject'] },
  { key: 'need_help_topic', category: 'help_request', emoji: '📚', text: "I'd like some help with this topic.", placeholders: [] },
  { key: 'difficulty', category: 'help_request', emoji: '📝', text: "I'm having difficulty understanding this subject.", placeholders: [] },
  { key: 'explain_topic', category: 'help_request', emoji: '💡', text: 'Could you explain this topic to me?', placeholders: [] },

  // Offering help
  { key: 'can_help', category: 'offering_help', emoji: '🙋', text: 'I can help you with this subject.', placeholders: [] },
  { key: 'can_help_subject', category: 'offering_help', emoji: '🙋', text: 'I can help you with {subject}.', placeholders: ['subject'] },
  { key: 'happy_study', category: 'offering_help', emoji: '📚', text: "I'd be happy to study this with you.", placeholders: [] },
  { key: 'can_explain', category: 'offering_help', emoji: '💡', text: 'I can explain what I know about this topic.', placeholders: [] },

  // Study together
  { key: 'would_study', category: 'study_together', emoji: '📚', text: 'Would you like to study together?', placeholders: [] },
  { key: 'lets_study', category: 'study_together', emoji: '🤝', text: "Let's study together.", placeholders: [] },
  { key: 'review_together', category: 'study_together', emoji: '📝', text: "Let's review this subject together.", placeholders: [] },

  // Availability
  { key: 'when_available', category: 'availability', emoji: '🕐', text: 'When are you available?', placeholders: [] },
  { key: 'morning', category: 'availability', emoji: '🌅', text: 'Are you available in the morning?', placeholders: [] },
  { key: 'afternoon', category: 'availability', emoji: '☀️', text: 'Are you available in the afternoon?', placeholders: [] },
  { key: 'evening', category: 'availability', emoji: '🌙', text: 'Are you available in the evening?', placeholders: [] },
  { key: 'my_slot', category: 'availability', emoji: '🕐', text: "I'm free {slot}.", placeholders: ['slot'] },

  // Study mode
  { key: 'prefer_online', category: 'study_mode', emoji: '💻', text: "I'd prefer to study online.", placeholders: [] },
  { key: 'prefer_in_person', category: 'study_mode', emoji: '🏫', text: "I'd prefer to study in person.", placeholders: [] },
  { key: 'either_mode', category: 'study_mode', emoji: '🔄', text: 'Either option works for me.', placeholders: [] },

  // Study session
  { key: 'schedule_session', category: 'study_session', emoji: '📅', text: "Let's schedule a study session.", placeholders: [] },
  { key: 'does_time_work', category: 'study_session', emoji: '⏰', text: 'Does this time work for you?', placeholders: ['session'] },
  { key: 'what_study', category: 'study_session', emoji: '📚', text: 'What should we study?', placeholders: [] },
  { key: 'running_late', category: 'study_session', emoji: '⏰', text: 'Running a few minutes late.', placeholders: [] },
  { key: 'on_my_way', category: 'study_session', emoji: '🏃', text: 'On my way!', placeholders: [] },
  { key: 'thanks_session', category: 'study_session', emoji: '🙏', text: 'Thanks for the session — that really helped!', placeholders: [] },

  // Confirmation
  { key: 'sounds_good', category: 'confirmation', emoji: '✅', text: 'Sounds good!', placeholders: [] },
  { key: 'works_for_me', category: 'confirmation', emoji: '👍', text: 'That works for me.', placeholders: [] },
  { key: 'see_you', category: 'confirmation', emoji: '🎉', text: 'See you then!', placeholders: [] },
  { key: 'ready', category: 'confirmation', emoji: '📚', text: "I'll be ready for our study session.", placeholders: [] },

  // Rescheduling
  { key: 'cant_make', category: 'rescheduling', emoji: '❌', text: "I can't make it at that time.", placeholders: [] },
  { key: 'another_time', category: 'rescheduling', emoji: '🕐', text: 'Can we choose another time?', placeholders: [] },
  { key: 'reschedule', category: 'rescheduling', emoji: '📅', text: 'Can we reschedule?', placeholders: [] },
];

export function templateByKey(key: string): MessageTemplate | undefined {
  return TEMPLATES.find((t) => t.key === key);
}

export function templatesByCategory(category: MessageCategory): MessageTemplate[] {
  return TEMPLATES.filter((t) => t.category === category);
}

/**
 * Conversation stage is derived, never stored, so it can't drift out of sync.
 */
export function deriveStage(
  messages: ChatMessage[],
  sessions: StudySession[],
): ConversationStage {
  if (sessions.some((s) => s.status !== 'cancelled')) return 'scheduled';
  const hasSubject = messages.some(
    (m) => Boolean(m.payload.subjectId) || m.templateKey === 'study_subject' || m.templateKey === 'help_subject' || m.templateKey === 'can_help_subject',
  );
  return hasSubject ? 'subject' : 'new';
}

const STAGE_CATEGORIES: Record<ConversationStage, MessageCategory[]> = {
  new: ['introduction', 'study_together'],
  subject: [
    'availability',
    'study_mode',
    'study_session',
    'help_request',
    'offering_help',
  ],
  scheduled: ['confirmation', 'rescheduling', 'study_session'],
};

export function suggestedCategories(stage: ConversationStage): MessageCategory[] {
  return STAGE_CATEGORIES[stage];
}

export function primarySuggestions(
  stage: ConversationStage,
  limit = 6,
): MessageTemplate[] {
  const cats = suggestedCategories(stage);
  const out: MessageTemplate[] = [];
  for (const key of PREFS[stage]) {
    const t = templateByKey(key);
    if (t && !out.includes(t)) out.push(t);
    if (out.length >= limit) break;
  }
  for (const cat of cats) {
    for (const t of templatesByCategory(cat)) {
      if (!out.includes(t)) out.push(t);
      if (out.length >= limit) break;
    }
    if (out.length >= limit) break;
  }
  return out;
}

const PREFS: Record<ConversationStage, string[]> = {
  new: ['hi', 'like_study', 'ask_subject', 'glad_matched'],
  subject: ['when_available', 'prefer_online', 'prefer_in_person', 'schedule_session', 'my_slot'],
  scheduled: ['sounds_good', 'works_for_me', 'see_you', 'reschedule'],
};

export function renderTemplate(
  text: string,
  ctx: { subjectName?: string; slotLabel?: string } = {},
): string {
  return text
    .replace('{subject}', ctx.subjectName ?? 'this subject')
    .replace('{slot}', ctx.slotLabel ?? 'that time');
}

export function placeholderCount(placeholders: PlaceholderType[]): number {
  return placeholders.length;
}
