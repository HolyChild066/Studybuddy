import { subjectById } from './subjects';
import type {
  Availability,
  Block,
  Decision,
  Student,
  SubjectEntry,
} from './types';

export interface ScoreBreakdown {
  subject: number;
  availability: number;
  preference: number;
  course: number;
  year: number;
}

export interface CandidateScore {
  student: Student;
  score: number;
  breakdown: ScoreBreakdown;
  reciprocal: boolean;
  sharedSubjectIds: string[];
  overlapMinutes: number;
}

const MIN_SCORE = 30;

function idsOf(entries: SubjectEntry[], kind: SubjectEntry['kind']): string[] {
  return entries.filter((e) => e.kind === kind).map((e) => e.subjectId);
}

function intersect(a: string[], b: string[]): string[] {
  const set = new Set(b);
  return [...new Set(a)].filter((x) => set.has(x));
}

/** Minutes between "HH:MM" strings. */
function minutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function overlap(a: Availability, b: Availability): number {
  if (a.day !== b.day) return 0;
  const start = Math.max(minutes(a.start), minutes(b.start));
  const end = Math.min(minutes(a.end), minutes(b.end));
  return Math.max(0, end - start);
}

export function availabilityOverlapMinutes(
  mine: Availability[],
  theirs: Availability[],
): number {
  let total = 0;
  for (const a of mine) {
    for (const b of theirs) total += overlap(a, b);
  }
  return total;
}

function totalMinutes(blocks: Availability[]): number {
  return blocks.reduce((sum, b) => sum + Math.max(0, minutes(b.end) - minutes(b.start)), 0);
}

export function scoreCandidate(me: Student, other: Student): CandidateScore {
  const meCan = idsOf(me.subjects, 'can_help');
  const meNeeds = idsOf(me.subjects, 'need_help');
  const meWants = idsOf(me.subjects, 'want_study');

  const theyCan = idsOf(other.subjects, 'can_help');
  const theyNeed = idsOf(other.subjects, 'need_help');
  const theyWant = idsOf(other.subjects, 'want_study');

  // I can help them / they can help me
  const iHelpThem = intersect(meCan, theyNeed);
  const theyHelpMe = intersect(theyCan, meNeeds);
  const sharedWant = intersect(meWants, theyWant);

  const reciprocal = iHelpThem.length > 0 && theyHelpMe.length > 0;

  let subject = 0;
  if (reciprocal) subject = 50;
  else if (iHelpThem.length > 0 || theyHelpMe.length > 0) subject = 30;
  else if (sharedWant.length > 0) subject = 15;

  const overlapMins = availabilityOverlapMinutes(me.availability, other.availability);
  const base = Math.max(totalMinutes(me.availability), 1);
  const availability = Math.min(15, Math.round((overlapMins / base) * 15));

  const preference =
    me.profile.studyPref === other.profile.studyPref
      ? 15
      : me.profile.studyPref === 'either' || other.profile.studyPref === 'either'
        ? 10
        : 0;

  const course = me.profile.course === other.profile.course ? 10 : 0;

  const yearDiff = Math.abs(me.profile.year - other.profile.year);
  const year = yearDiff === 0 ? 10 : yearDiff === 1 ? 7 : yearDiff === 2 ? 3 : 0;

  const sharedSubjectIds = [
    ...new Set([...iHelpThem, ...theyHelpMe, ...sharedWant]),
  ];

  const score = Math.min(
    100,
    subject + availability + preference + course + year,
  );

  return {
    student: other,
    score,
    breakdown: { subject, availability, preference, course, year },
    reciprocal,
    sharedSubjectIds,
    overlapMinutes: overlapMins,
  };
}

export function isBlocked(
  blocks: Block[],
  a: string,
  b: string,
): boolean {
  return blocks.some(
    (x) =>
      (x.blockerId === a && x.blockedId === b) ||
      (x.blockerId === b && x.blockedId === a),
  );
}

export function hasDecided(
  decisions: Decision[],
  viewerId: string,
  targetId: string,
): boolean {
  return decisions.some((d) => d.viewerId === viewerId && d.targetId === targetId);
}

export function buildDeck(
  me: Student,
  students: Student[],
  decisions: Decision[],
  blocks: Block[],
): CandidateScore[] {
  return students
    .filter((s) => s.profile.id !== me.profile.id)
    .filter((s) => s.profile.verification === 'approved')
    .filter((s) => !hasDecided(decisions, me.profile.id, s.profile.id))
    .filter((s) => !isBlocked(blocks, me.profile.id, s.profile.id))
    .map((s) => scoreCandidate(me, s))
    .filter((c) => c.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);
}

export function sharedSubjectNames(ids: string[]): string[] {
  return ids.map((id) => subjectById(id)?.name ?? id);
}

export const MIN_MATCH_SCORE = MIN_SCORE;
