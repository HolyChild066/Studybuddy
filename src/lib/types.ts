export type StudyPref = 'online' | 'in_person' | 'either';
export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type SubjectKind = 'can_help' | 'need_help' | 'want_study';

export interface Subject {
  id: string;
  code: string;
  name: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  course: string;
  year: number;
  bio: string;
  studyPref: StudyPref;
  avatarColor: string;
  university: string;
  verification: VerificationStatus;
}

export interface SubjectEntry {
  subjectId: string;
  kind: SubjectKind;
  level?: 1 | 2 | 3;
}

export interface Availability {
  day: number; // 0 = Sunday
  start: string; // HH:MM
  end: string; // HH:MM
}

export interface Student {
  profile: Profile;
  subjects: SubjectEntry[];
  availability: Availability[];
}

export type DecisionAction = 'pass' | 'study';

export interface Decision {
  viewerId: string;
  targetId: string;
  action: DecisionAction;
  at: number;
}

export interface Match {
  id: string;
  a: string;
  b: string;
  at: number;
}

export type MessageCategory =
  | 'introduction'
  | 'help_request'
  | 'offering_help'
  | 'study_together'
  | 'availability'
  | 'study_mode'
  | 'study_session'
  | 'confirmation'
  | 'rescheduling';

export type PlaceholderType = 'subject' | 'slot' | 'session';

export interface MessageTemplate {
  key: string;
  category: MessageCategory;
  emoji: string;
  text: string;
  placeholders: PlaceholderType[];
}

export interface MessagePayload {
  subjectId?: string;
  slot?: string;
  sessionId?: string;
}

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  templateKey: string;
  payload: MessagePayload;
  at: number;
}

export type SessionMode = 'online' | 'in_person';
export type SessionStatus = 'proposed' | 'confirmed' | 'completed' | 'cancelled';

export interface StudySession {
  id: string;
  matchId: string;
  subjectId: string;
  createdBy: string;
  date: string;
  start: string;
  end: string;
  mode: SessionMode;
  location: 'Online' | 'University Library';
  status: SessionStatus;
  safetyAcknowledged: boolean;
}

export interface Block {
  blockerId: string;
  blockedId: string;
  at: number;
}

export type ReportReason =
  | 'harassment'
  | 'spam'
  | 'inappropriate'
  | 'fake_identity'
  | 'academic_misconduct'
  | 'other';

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  messageId?: string;
  messageText?: string;
  messageCategory?: MessageCategory;
  reason: ReportReason;
  note?: string;
  status: 'open';
  at: number;
}

export type ConversationStage = 'new' | 'subject' | 'scheduled';
