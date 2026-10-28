import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { isBlocked, scoreCandidate } from './matching';
import type { CandidateScore } from './matching';
import { buildDeck as buildDeckLocal } from './matching';
import { UNIVERSITY } from './subjects';
import { isSupabaseConfigured, supabase } from './supabase';
import type {
  Availability,
  Block,
  ChatMessage,
  Decision,
  DecisionAction,
  Match,
  MessagePayload,
  Profile,
  Report,
  ReportReason,
  SessionMode,
  SessionStatus,
  Student,
  StudySession,
  SubjectEntry,
  VerificationStatus,
} from './types';

const STORAGE_KEY = 'studymate.state.v1';

const AVATAR_COLORS = ['#3B4FE0', '#FF5A4F', '#12B76A', '#8B5CF6', '#0EA5E9', '#F59E0B'];

function randomAvatar(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] ?? '#3B4FE0';
}

interface AppState {
  hydrated: boolean;
  signedIn: boolean;
  currentUserId: string | null;
  students: Record<string, Student>;
  decisions: Decision[];
  matches: Match[];
  messages: ChatMessage[];
  sessions: StudySession[];
  blocks: Block[];
  reports: Report[];
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('::');
}

const seedStudents: Record<string, Student> = {
  u_alex: {
    profile: {
      id: 'u_alex',
      name: 'Alex Morgan',
      email: 'alex@northbridge.edu',
      course: 'BS Information Technology',
      year: 2,
      bio: 'Second-year IT student. I like breaking code down until it finally clicks.',
      studyPref: 'either',
      avatarColor: '#3B4FE0',
      university: UNIVERSITY,
      verification: 'approved',
    },
    subjects: [
      { subjectId: 'it102', kind: 'can_help', level: 3 },
      { subjectId: 'it103', kind: 'can_help', level: 2 },
      { subjectId: 'it203', kind: 'need_help' },
      { subjectId: 'it204', kind: 'want_study' },
    ],
    availability: [
      { day: 1, start: '18:00', end: '21:00' },
      { day: 3, start: '18:00', end: '21:00' },
      { day: 6, start: '09:00', end: '12:00' },
    ],
  },
  u_jamie: {
    profile: {
      id: 'u_jamie',
      name: 'Jamie Cruz',
      email: 'jamie@northbridge.edu',
      course: 'BS Information Technology',
      year: 2,
      bio: 'Databases make sense to me. Java does not. Let us trade notes.',
      studyPref: 'either',
      avatarColor: '#FF5A4F',
      university: UNIVERSITY,
      verification: 'approved',
    },
    subjects: [
      { subjectId: 'it203', kind: 'can_help', level: 3 },
      { subjectId: 'it102', kind: 'need_help' },
      { subjectId: 'it205', kind: 'want_study' },
    ],
    availability: [
      { day: 2, start: '18:00', end: '21:00' },
      { day: 4, start: '18:00', end: '21:00' },
      { day: 6, start: '09:00', end: '12:00' },
    ],
  },
  u_maria: {
    profile: {
      id: 'u_maria',
      name: 'Maria Santos',
      email: 'maria@northbridge.edu',
      course: 'BS Computer Science',
      year: 2,
      bio: 'I tutor ER diagrams at the library on Mondays. Bring your messy schema.',
      studyPref: 'in_person',
      avatarColor: '#12B76A',
      university: UNIVERSITY,
      verification: 'approved',
    },
    subjects: [
      { subjectId: 'it203', kind: 'can_help', level: 3 },
      { subjectId: 'it204', kind: 'need_help' },
      { subjectId: 'math101', kind: 'can_help', level: 2 },
    ],
    availability: [
      { day: 1, start: '17:00', end: '20:00' },
      { day: 3, start: '17:00', end: '20:00' },
    ],
  },
  u_sam: {
    profile: {
      id: 'u_sam',
      name: 'Sam Rivera',
      email: 'sam@northbridge.edu',
      course: 'BS Information Systems',
      year: 2,
      bio: 'Normalization, transactions, and quiet corners of the library.',
      studyPref: 'online',
      avatarColor: '#8B5CF6',
      university: UNIVERSITY,
      verification: 'approved',
    },
    subjects: [
      { subjectId: 'it203', kind: 'can_help', level: 2 },
      { subjectId: 'math101', kind: 'need_help' },
      { subjectId: 'it101', kind: 'want_study' },
    ],
    availability: [
      { day: 2, start: '19:00', end: '22:00' },
      { day: 5, start: '14:00', end: '17:00' },
    ],
  },
};

function initialState(): AppState {
  return {
    hydrated: false,
    signedIn: false,
    currentUserId: null,
    students: seedStudents,
    decisions: [
      // Jamie already studied Alex back, so the very first "Study" tap
      // demonstrates the mutual-match rule end to end.
      { viewerId: 'u_jamie', targetId: 'u_alex', action: 'study', at: Date.now() - 3600_000 },
    ],
    matches: [],
    messages: [],
    sessions: [],
    blocks: [],
    reports: [],
  };
}

interface SignUpInput {
  name: string;
  email: string;
  course: string;
  year: number;
}

interface CreateSessionInput {
  matchId: string;
  subjectId: string;
  date: string;
  start: string;
  end: string;
  mode: SessionMode;
  safetyAcknowledged: boolean;
}

interface ReportInput {
  reportedId: string;
  reason: ReportReason;
  messageId?: string;
  messageText?: string;
  messageCategory?: Report['messageCategory'];
  note?: string;
}

interface AppContextValue {
  state: AppState;
  currentStudent: Student | null;
  deck: CandidateScore[];
  myMatches: Match[];
  signIn: (email: string, password?: string) => void;
  signUp: (input: SignUpInput, password?: string) => void;
  signOut: () => void;
  switchUser: (id: string) => void;
  completeVerification: () => void;
  setVerification: (status: VerificationStatus) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  saveSubjects: (entries: SubjectEntry[]) => void;
  saveAvailability: (blocks: Availability[]) => void;
  decide: (targetId: string, action: DecisionAction) => string | null;
  scoreFor: (targetId: string) => CandidateScore | null;
  sendMessage: (matchId: string, templateKey: string, payload?: MessagePayload) => void;
  createSession: (input: CreateSessionInput) => string;
  setSessionStatus: (sessionId: string, status: SessionStatus) => void;
  blockUser: (targetId: string) => void;
  reportUser: (input: ReportInput) => void;
  studentById: (id: string) => Student | undefined;
  matchFor: (matchId: string) => Match | undefined;
  partnerOf: (match: Match) => Student | undefined;
  isBlockedWith: (otherId: string) => boolean;
  resetDemo: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && alive) {
          const parsed = JSON.parse(raw) as Partial<AppState>;
          setState({ ...initialState(), ...parsed, hydrated: true });
          return;
        }
      } catch {
        // fall through to a clean demo state
      }
      if (alive) setState((s) => ({ ...s, hydrated: true }));
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let mounted = true;

    const syncAuth = async () => {
      const sb = supabase!;
      const { data } = await sb.auth.getSession();
      if (!mounted) return;
      if (data.session?.user) {
        setState((s) => ({
          ...s,
          signedIn: true,
          currentUserId: data.session!.user.id,
        }));
      }
    };

    void syncAuth();

    const sb = supabase!;
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setState((s) => ({
          ...s,
          signedIn: true,
          currentUserId: session.user.id,
        }));
      } else {
        setState((s) => ({
          ...s,
          signedIn: false,
          currentUserId: null,
        }));
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Load data from Supabase when authenticated
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    if (!state.signedIn || !state.currentUserId) return;

    let mounted = true;

    (async () => {
      try {
        const sb = supabase!;
        const uid = state.currentUserId!;

        const [profileRes, subjectsRes, availabilityRes, blocksRes, decisionsRes, matchesRes, reportsRes] = await Promise.all([
          sb.from('profiles').select('*').eq('id', uid).maybeSingle(),
          sb.from('profile_subjects').select('*').eq('profile_id', uid),
          sb.from('availability').select('*').eq('profile_id', uid),
          sb.from('blocks').select('*').or(`blocker_id.eq.${uid},blocked_id.eq.${uid}`),
          sb.from('decisions').select('*').eq('viewer_id', uid),
          sb.from('matches').select('*').or(`user_a.eq.${uid},user_b.eq.${uid}`),
          sb.from('reports').select('*').eq('reporter_id', uid),
        ]);

        if (!mounted) return;

        setState((s) => {
          const next = { ...s };
          const students = { ...s.students };

          // Profile
          if (profileRes.data) {
            const p = profileRes.data;
            students[uid] = {
              profile: {
                id: p.id,
                name: p.name,
                email: p.email,
                course: p.course,
                year: p.year,
                bio: p.bio || '',
                studyPref: p.study_pref,
                avatarColor: p.avatar_color || '#3B4FE0',
                university: p.university || 'Northbridge University',
                verification: p.verification,
              },
              subjects: (subjectsRes.data || []).map((ps: any) => ({
                subjectId: ps.subject_id,
                kind: ps.kind,
              })),
              availability: (availabilityRes.data || []).map((a: any) => ({
                day: a.day,
                start: a.start_time?.slice(0, 5),
                end: a.end_time?.slice(0, 5),
              })),
            };
          }

          next.students = students;
          next.blocks = (blocksRes.data || []).map((b: any) => ({
            blockerId: b.blocker_id,
            blockedId: b.blocked_id,
            at: new Date(b.created_at).getTime(),
          }));
          next.decisions = (decisionsRes.data || []).map((d: any) => ({
            viewerId: d.viewer_id,
            targetId: d.target_id,
            action: d.action,
            at: new Date(d.created_at).getTime(),
          }));
          next.matches = (matchesRes.data || []).map((m: any) => ({
            id: m.id,
            a: m.user_a,
            b: m.user_b,
            at: new Date(m.created_at).getTime(),
          }));
          next.reports = (reportsRes.data || []).map((r: any) => ({
            id: r.id,
            reporterId: r.reporter_id,
            reportedId: r.reported_id,
            messageId: r.message_id || undefined,
            messageText: r.message_text || undefined,
            messageCategory: r.message_category || undefined,
            reason: r.reason,
            note: r.note || undefined,
            status: r.status,
            at: new Date(r.created_at).getTime(),
          }));

          return next;
        });
      } catch (e) {
        console.warn('Supabase load failed', e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [state.signedIn, state.currentUserId]);

  useEffect(() => {
    if (!state.hydrated) return;
    const { hydrated: _hydrated, ...persisted } = state;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted)).catch(() => {});
  }, [state]);

  const currentStudent = state.currentUserId
    ? (state.students[state.currentUserId] ?? null)
    : null;

  const signIn = useCallback((email: string, password?: string) => {
    if (isSupabaseConfigured && supabase) {
      void (async () => {
        try {
          const sb = supabase!;
          await sb.auth.signInWithPassword({ email: email.trim(), password: password ?? '' });
        } catch (e) {
          console.warn('Supabase sign-in failed, falling back to local demo', e);
          setState((s) => {
            const normalized = email.trim().toLowerCase();
            const found =
              Object.values(s.students).find(
                (st) => st.profile.email.toLowerCase() === normalized,
              ) ?? s.students['u_alex'];
            return {
              ...s,
              signedIn: true,
              currentUserId: found?.profile.id ?? 'u_alex',
            };
          });
        }
      })();
      return;
    }

    setState((s) => {
      const normalized = email.trim().toLowerCase();
      const found =
        Object.values(s.students).find(
          (st) => st.profile.email.toLowerCase() === normalized,
        ) ?? s.students['u_alex'];
      return {
        ...s,
        signedIn: true,
        currentUserId: found?.profile.id ?? 'u_alex',
      };
    });
  }, []);

  const signUp = useCallback((input: SignUpInput, password?: string) => {
    if (isSupabaseConfigured && supabase) {
      void (async () => {
        try {
          const sb = supabase!;
          await sb.auth.signUp({
            email: input.email.trim(),
            password: password ?? '',
            options: {
              data: {
                name: input.name.trim() || 'New Student',
                course: input.course,
                year: input.year,
              },
            },
          });
        } catch (e) {
          console.warn('Supabase sign-up failed, falling back to local demo', e);
          setState((s) => {
            const id = uid('u');
            const profile: Profile = {
              id,
              name: input.name.trim() || 'New Student',
              email: input.email.trim().toLowerCase(),
              course: input.course,
              year: input.year,
              bio: '',
              studyPref: 'either',
              avatarColor:
                AVATAR_COLORS[Object.keys(s.students).length % AVATAR_COLORS.length] ??
                '#3B4FE0',
              university: UNIVERSITY,
              verification: 'none',
            };
            const student: Student = { profile, subjects: [], availability: [] };
            return {
              ...s,
              students: { ...s.students, [id]: student },
              signedIn: true,
              currentUserId: id,
            };
          });
        }
      })();
      return;
    }

    setState((s) => {
      const id = uid('u');
      const profile: Profile = {
        id,
        name: input.name.trim() || 'New Student',
        email: input.email.trim().toLowerCase(),
        course: input.course,
        year: input.year,
        bio: '',
        studyPref: 'either',
        avatarColor:
          AVATAR_COLORS[Object.keys(s.students).length % AVATAR_COLORS.length] ??
          '#3B4FE0',
        university: UNIVERSITY,
        verification: 'none',
      };
      const student: Student = { profile, subjects: [], availability: [] };
      return {
        ...s,
        students: { ...s.students, [id]: student },
        signedIn: true,
        currentUserId: id,
      };
    });
  }, []);

  const signOut = useCallback(() => {
    if (isSupabaseConfigured && supabase) {
      void supabase.auth.signOut();
    }
    setState((s) => ({ ...s, signedIn: false, currentUserId: null }));
  }, []);

  const switchUser = useCallback((id: string) => {
    setState((s) => (s.students[id] ? { ...s, currentUserId: id, signedIn: true } : s));
  }, []);

  const patchCurrent = useCallback(
    (fn: (student: Student) => Student) => {
      setState((s) => {
        if (!s.currentUserId) return s;
        const current = s.students[s.currentUserId];
        if (!current) return s;
        return {
          ...s,
          students: { ...s.students, [s.currentUserId]: fn(current) },
        };
      });
    },
    [],
  );

  const completeVerification = useCallback(() => {
    patchCurrent((st) => ({
      ...st,
      profile: { ...st.profile, verification: 'approved' },
    }));
  }, [patchCurrent]);

  const setVerification = useCallback(
    (status: VerificationStatus) => {
      patchCurrent((st) => ({ ...st, profile: { ...st.profile, verification: status } }));
    },
    [patchCurrent],
  );

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => {
      patchCurrent((st) => ({ ...st, profile: { ...st.profile, ...patch } }));
    },
    [patchCurrent],
  );

  const saveSubjects = useCallback(
    (entries: SubjectEntry[]) => {
      patchCurrent((st) => ({ ...st, subjects: entries }));
    },
    [patchCurrent],
  );

  const saveAvailability = useCallback(
    (blocks: Availability[]) => {
      patchCurrent((st) => ({ ...st, availability: blocks }));
    },
    [patchCurrent],
  );

  const decide = useCallback(
    (targetId: string, action: DecisionAction): string | null => {
      if (!state.currentUserId) return null;
      const me = state.currentUserId;
      let created: string | null = null;

      if (action === 'study') {
        const reciprocal = state.decisions.some(
          (d) => d.viewerId === targetId && d.targetId === me && d.action === 'study',
        );
        const exists = state.matches.some(
          (m) => pairKey(m.a, m.b) === pairKey(me, targetId),
        );
        if (reciprocal && !exists) created = uid('match');
      }

      setState((s) => {
        const decisions: Decision[] = [
          ...s.decisions.filter(
            (d) => !(d.viewerId === me && d.targetId === targetId),
          ),
          { viewerId: me, targetId, action, at: Date.now() },
        ];
        let matches = s.matches;
        if (action === 'study' && created) {
          matches = [...s.matches, { id: created, a: me, b: targetId, at: Date.now() }];
        }
        return { ...s, decisions, matches };
      });

      return created;
    },
    [state.currentUserId, state.decisions, state.matches],
  );

  const scoreFor = useCallback(
    (targetId: string): CandidateScore | null => {
      const me = currentStudent;
      const other = state.students[targetId];
      if (!me || !other) return null;
      return scoreCandidate(me, other);
    },
    [currentStudent, state.students],
  );

  const sendMessage = useCallback(
    (matchId: string, templateKey: string, payload: MessagePayload = {}) => {
      setState((s) => {
        if (!s.currentUserId) return s;
        const message: ChatMessage = {
          id: uid('msg'),
          matchId,
          senderId: s.currentUserId,
          templateKey,
          payload,
          at: Date.now(),
        };
        return { ...s, messages: [...s.messages, message] };
      });
    },
    [],
  );

  const createSession = useCallback((input: CreateSessionInput): string => {
    const id = uid('session');
    setState((s) => {
      if (!s.currentUserId) return s;
      const session: StudySession = {
        id,
        matchId: input.matchId,
        subjectId: input.subjectId,
        createdBy: s.currentUserId,
        date: input.date,
        start: input.start,
        end: input.end,
        mode: input.mode,
        location: input.mode === 'online' ? 'Online' : 'University Library',
        status: 'proposed',
        safetyAcknowledged: input.safetyAcknowledged,
      };
      return { ...s, sessions: [...s.sessions, session] };
    });
    return id;
  }, []);

  const setSessionStatus = useCallback((sessionId: string, status: SessionStatus) => {
    setState((s) => ({
      ...s,
      sessions: s.sessions.map((x) => (x.id === sessionId ? { ...x, status } : x)),
    }));
  }, []);

  const blockUser = useCallback((targetId: string) => {
    setState((s) => {
      if (!s.currentUserId) return s;
      const exists = s.blocks.some(
        (b) => b.blockerId === s.currentUserId && b.blockedId === targetId,
      );
      if (exists) return s;
      return {
        ...s,
        blocks: [
          ...s.blocks,
          { blockerId: s.currentUserId, blockedId: targetId, at: Date.now() },
        ],
      };
    });
  }, []);

  const reportUser = useCallback((input: ReportInput) => {
    setState((s) => {
      if (!s.currentUserId) return s;
      const report: Report = {
        id: uid('report'),
        reporterId: s.currentUserId,
        reportedId: input.reportedId,
        messageId: input.messageId,
        messageText: input.messageText,
        messageCategory: input.messageCategory,
        reason: input.reason,
        note: input.note,
        status: 'open',
        at: Date.now(),
      };
      return { ...s, reports: [...s.reports, report] };
    });
  }, []);

  const resetDemo = useCallback(() => {
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    setState({ ...initialState(), hydrated: true });
  }, []);

  const studentById = useCallback(
    (id: string) => state.students[id],
    [state.students],
  );

  const matchFor = useCallback(
    (matchId: string) => state.matches.find((m) => m.id === matchId),
    [state.matches],
  );

  const partnerOf = useCallback(
    (match: Match) => {
      const otherId = match.a === state.currentUserId ? match.b : match.a;
      return state.students[otherId];
    },
    [state.currentUserId, state.students],
  );

  const isBlockedWith = useCallback(
    (otherId: string) =>
      Boolean(state.currentUserId) && isBlocked(state.blocks, state.currentUserId!, otherId),
    [state.blocks, state.currentUserId],
  );

  const deck = useMemo(() => {
    if (!currentStudent) return [];
    return buildDeckLocal(
      currentStudent,
      Object.values(state.students),
      state.decisions,
      state.blocks,
    );
  }, [currentStudent, state.students, state.decisions, state.blocks]);

  const myMatches = useMemo(() => {
    if (!state.currentUserId) return [];
    return state.matches
      .filter((m) => m.a === state.currentUserId || m.b === state.currentUserId)
      .filter((m) => {
        const other = m.a === state.currentUserId ? m.b : m.a;
        return !isBlocked(state.blocks, state.currentUserId!, other);
      })
      .sort((a, b) => b.at - a.at);
  }, [state.matches, state.blocks, state.currentUserId]);

  const value: AppContextValue = {
    state,
    currentStudent,
    deck,
    myMatches,
    signIn,
    signUp,
    signOut,
    switchUser,
    completeVerification,
    setVerification,
    updateProfile,
    saveSubjects,
    saveAvailability,
    decide,
    scoreFor,
    sendMessage,
    createSession,
    setSessionStatus,
    blockUser,
    reportUser,
    studentById,
    matchFor,
    partnerOf,
    isBlockedWith,
    resetDemo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
