import type { StudyPref, Subject, SubjectKind } from './types';

export const UNIVERSITY = 'Northbridge University';

export const SUBJECTS: Subject[] = [
  { id: 'it101', code: 'IT 101', name: 'Introduction to Computing' },
  { id: 'it102', code: 'IT 102', name: 'Programming 1' },
  { id: 'it103', code: 'IT 103', name: 'Data Structures' },
  { id: 'it203', code: 'IT 203', name: 'Database Systems' },
  { id: 'it204', code: 'IT 204', name: 'Web Development' },
  { id: 'it205', code: 'IT 205', name: 'Information Management' },
  { id: 'math101', code: 'MATH 101', name: 'Calculus 1' },
  { id: 'ge101', code: 'GE 101', name: 'Understanding the Self' },
];

export const COURSES = [
  'BS Information Technology',
  'BS Computer Science',
  'BS Information Systems',
  'BS Computer Engineering',
];

export const YEARS = [1, 2, 3, 4];

export const STUDY_PREF_LABEL: Record<StudyPref, string> = {
  online: 'Online',
  in_person: 'In-person',
  either: 'Either',
};

export const SUBJECT_KIND_LABEL: Record<SubjectKind, string> = {
  can_help: 'Can help',
  need_help: 'Needs help',
  want_study: 'Wants to study',
};

export const SUBJECT_KIND_HINT: Record<SubjectKind, string> = {
  can_help: 'Subjects you can teach or review with a peer.',
  need_help: 'Subjects you want help understanding.',
  want_study: 'Subjects you would simply like to study with someone.',
};

export function subjectById(id: string): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id);
}

export function subjectLabel(id: string): string {
  return subjectById(id)?.name ?? id;
}

export function subjectCode(id: string): string {
  return subjectById(id)?.code ?? '';
}

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatSlot(slot: string): string {
  // slot format: "1|18:00|21:00"
  const [dayRaw, start, end] = slot.split('|');
  const day = Number(dayRaw);
  return `${DAY_LABELS[day] ?? ''} ${to12h(start)}–${to12h(end)}`;
}

export function to12h(time: string): string {
  const [hRaw, m] = time.split(':');
  const h = Number(hRaw);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m} ${suffix}`;
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
