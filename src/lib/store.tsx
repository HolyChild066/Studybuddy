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
        if (isSupabaseConfigured) {
          // Clear old demo state that may have cached signedIn/currentUserId
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && alive) {
          const parsed = JSON.parse(raw) as Partial<AppState>;
          if (isSupabaseConfigured) {
            setState({ ...initialState(), ...parsed, signedIn: false, currentUserId: null, hydrated: true });
          } else {
            setState({ ...initialState(), ...parsed, hydrated: true });
          }
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

        const { data: sessionData } = await sb.auth.getSession();
        const session = sessionData.session;

        setState((s) => {
          const next = { ...s };
          const students = { ...s.students };

          // Profile — create from auth session if it doesn't exist yet
          let profile: any = profileRes.data;
          if (!profile && session?.user) {
            const u = session.user;
            profile = {
              id: u.id,
              name: (u.user_metadata?.name as string) || u.email?.split('@')[0] || 'Student',
              email: u.email || '',
              course: (u.user_metadata?.course as string) || 'BS Information Technology',
              year: (u.user_metadata?.year as number) || 1,
              bio: '',
              studyPref: 'either',
              avatarColor: randomAvatar(),
              university: 'Northbridge University',
              verification: 'none',
            };
            // Insert the profile so it persists
            void sb.from('profiles').insert({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              course: profile.course,
              year: profile.year,
              study_pref: profile.studyPref,
              avatar_color: profile.avatarColor,
            });
          }

          if (profile) {
            students[uid] = {
              profile: {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                course: profile.course,
                year: profile.year,
                bio: profile.bio || '',
                studyPref: profile.study_pref || profile.studyPref,
                avatarColor: profile.avatar_color || profile.avatarColor,
                university: profile.university || 'Northbridge University',
                verification: profile.verification,
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

        // Load messages and sessions for matches
        const matchIds = (matchesRes.data || []).map((m: any) => m.id);
        if (matchIds.length > 0) {
          const [messagesRes, sessionsRes] = await Promise.all([
            sb.from('messages').select('*').in('match_id', matchIds).order('created_at', { ascending: true }),
            sb.from('study_sessions').select('*').in('match_id', matchIds).order('created_at', { ascending: true }),
          ]);

          if (!mounted) return;

          setState((s) => ({
            ...s,
            messages: (messagesRes.data || []).map((msg: any) => ({
              id: msg.id,
              matchId: msg.match_id,
              senderId: msg.sender_id,
              templateKey: msg.template_key,
              payload: msg.payload || {},
              at: new Date(msg.created_at).getTime(),
            })),
            sessions: (sessionsRes.data || []).map((ses: any) => ({
              id: ses.id,
              matchId: ses.match_id,
              subjectId: ses.subject_id,
              createdBy: ses.created_by,
              date: ses.session_date,
              start: ses.start_time?.slice(0, 5),
              end: ses.end_time?.slice(0, 5),
              mode: ses.mode,
              location: ses.location,
              status: ses.status,
              safetyAcknowledged: ses.safety_acknowledged,
            })),
          }));
        }

        // Load all approved public profiles for the deck
        const { data: publicProfiles } = await sb.from('public_profiles').select('*');
        if (publicProfiles && publicProfiles.length > 0 && mounted) {
          // Load subjects and availability for each public profile
          const otherIds = publicProfiles.map((p: any) => p.id).filter((id: string) => id !== uid);
          const [otherSubjects, otherAvailability] = await Promise.all([
            sb.from('profile_subjects').select('*').in('profile_id', otherIds),
            sb.from('availability').select('*').in('profile_id', otherIds),
          ]);

          setState((s) => {
            const students = { ...s.students };
            for (const p of publicProfiles) {
              if (p.id === uid) continue;
              const subs = (otherSubjects.data || []).filter((ps: any) => ps.profile_id === p.id).map((ps: any) => ({
                subjectId: ps.subject_id,
                kind: ps.kind,
              }));
              const avail = (otherAvailability.data || []).filter((a: any) => a.profile_id === p.id).map((a: any) => ({
                day: a.day,
                start: a.start_time?.slice(0, 5),
                end: a.end_time?.slice(0, 5),
              }));
              students[p.id] = {
                profile: {
                  id: p.id,
                  name: p.name,
                  email: '',
                  course: p.course,
                  year: p.year,
                  bio: p.bio || '',
                  studyPref: p.study_pref,
                  avatarColor: p.avatar_color || '#3B4FE0',
                  university: p.university || 'Northbridge University',
                  verification: 'approved',
                },
                subjects: subs,
                availability: avail,
              };
            }
            return { ...s, students };
          });
        }
      } catch (e) {
        console.warn('Supabase load failed', e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [state.signedIn, state.currentUserId]);

  // Realtime subscriptions: messages, sessions, matches push live between accounts
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    if (!state.signedIn || !state.currentUserId) return;

    const sb = supabase!;
    const uid = state.currentUserId;
    let mounted = true;
    const channels: ReturnType<typeof sb.channel>[] = [];

    // Messages: new messages in any of the user's matches (RLS already restricts to participants)
    const messagesChannel = sb.channel('messages-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload: any) => {
        if (!mounted) return;
        const msg = payload.new as any;
        setState((s) => {
          if (s.messages.some((m) => m.id === msg.id)) return s;
          return {
            ...s,
            messages: [...s.messages, {
              id: msg.id,
              matchId: msg.match_id,
              senderId: msg.sender_id,
              templateKey: msg.template_key,
              payload: msg.payload || {},
              at: new Date(msg.created_at).getTime(),
            }].sort((a, b) => a.at - b.at),
          };
        });
      })
      .subscribe();
    channels.push(messagesChannel);

    // Study sessions: new sessions + status updates (accept/decline/complete)
    const sessionsChannel = sb.channel('sessions-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'study_sessions',
      }, (payload: any) => {
        if (!mounted) return;
        const ses = payload.new as any;
        setState((s) => {
          if (s.sessions.some((s2) => s2.id === ses.id)) return s;
          return {
            ...s,
            sessions: [...s.sessions, {
              id: ses.id,
              matchId: ses.match_id,
              subjectId: ses.subject_id,
              createdBy: ses.created_by,
              date: ses.session_date,
              start: ses.start_time?.slice(0, 5),
              end: ses.end_time?.slice(0, 5),
              mode: ses.mode,
              location: ses.location,
              status: ses.status,
              safetyAcknowledged: ses.safety_acknowledged,
            }],
          };
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'study_sessions',
      }, (payload: any) => {
        if (!mounted) return;
        const ses = payload.new as any;
        setState((s) => ({
          ...s,
          sessions: s.sessions.map((s2) =>
            s2.id === ses.id ? { ...s2, status: ses.status } : s2
          ),
        }));
      })
      .subscribe();
    channels.push(sessionsChannel);

    // Matches: new mutual matches created (trigger fires on both sides)
    const matchesChannel = sb.channel('matches-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
      }, (payload: any) => {
        if (!mounted) return;
        const m = payload.new as any;
        setState((s) => {
          if (s.matches.some((mm) => mm.id === m.id)) return s;
          return {
            ...s,
            matches: [...s.matches, {
              id: m.id,
              a: m.user_a,
              b: m.user_b,
              at: new Date(m.created_at).getTime(),
            }],
          };
        });
      })
      .subscribe();
    channels.push(matchesChannel);

    return () => {
      mounted = false;
      channels.forEach((ch) => sb.removeChannel(ch));
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

  const signIn = useCallback((email: string, password?: string): Promise<void> => {
    if (isSupabaseConfigured && supabase) {
      return (async () => {
        try {
          const sb = supabase!;
          const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: password ?? '' });
          if (error) {
            throw new Error(error.message);
          }
        } catch (e) {
          throw e instanceof Error ? e : new Error(String(e));
        }
      })();
    }

    return Promise.resolve().then(() => {
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
    });
  }, []);

  const signUp = useCallback((input: SignUpInput, password?: string) => {
    if (isSupabaseConfigured && supabase) {
      void (async () => {
        try {
          const sb = supabase!;
          const { error } = await sb.auth.signUp({
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
          if (error) {
            console.warn('Supabase sign-up failed:', error.message);
          }
        } catch (e) {
          console.warn('Supabase sign-up failed:', e);
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
      if (isSupabaseConfigured && supabase && state.currentUserId) {
        const sb = supabase;
        const updates: any = {};
        if (patch.name !== undefined) updates.name = patch.name;
        if (patch.course !== undefined) updates.course = patch.course;
        if (patch.year !== undefined) updates.year = patch.year;
        if (patch.bio !== undefined) updates.bio = patch.bio;
        if (patch.studyPref !== undefined) updates.study_pref = patch.studyPref;
        if (patch.avatarColor !== undefined) updates.avatar_color = patch.avatarColor;
        void sb.from('profiles').update(updates).eq('id', state.currentUserId);
      }
    },
    [patchCurrent, state.currentUserId],
  );

  const saveSubjects = useCallback(
    (entries: SubjectEntry[]) => {
      patchCurrent((st) => ({ ...st, subjects: entries }));
      if (isSupabaseConfigured && supabase && state.currentUserId) {
        const sb = supabase;
        const uid = state.currentUserId;
        void (async () => {
          await sb.from('profile_subjects').delete().eq('profile_id', uid);
          if (entries.length > 0) {
            await sb.from('profile_subjects').insert(
              entries.map((e) => ({
                profile_id: uid,
                subject_id: e.subjectId,
                kind: e.kind,
              })),
            );
          }
        })();
      }
    },
    [patchCurrent, state.currentUserId],
  );

  const saveAvailability = useCallback(
    (blocks: Availability[]) => {
      patchCurrent((st) => ({ ...st, availability: blocks }));
      if (isSupabaseConfigured && supabase && state.currentUserId) {
        const sb = supabase;
        const uid = state.currentUserId;
        void (async () => {
          await sb.from('availability').delete().eq('profile_id', uid);
          if (blocks.length > 0) {
            await sb.from('availability').insert(
              blocks.map((b) => ({
                profile_id: uid,
                day: b.day,
                start_time: b.start,
                end_time: b.end,
              })),
            );
          }
        })();
      }
    },
    [patchCurrent, state.currentUserId],
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

      if (isSupabaseConfigured && supabase) {
        void supabase
          .from('decisions')
          .upsert({ viewer_id: me, target_id: targetId, action }, { onConflict: 'viewer_id,target_id' });
      }

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
      if (isSupabaseConfigured && supabase && state.currentUserId) {
        void supabase.from('messages').insert({
          match_id: matchId,
          sender_id: state.currentUserId,
          template_key: templateKey,
          payload,
        });
      }
    },
    [state.currentUserId],
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
    if (isSupabaseConfigured && supabase && state.currentUserId) {
      void supabase.from('study_sessions').insert({
        id,
        match_id: input.matchId,
        subject_id: input.subjectId,
        created_by: state.currentUserId,
        session_date: input.date,
        start_time: input.start,
        end_time: input.end,
        mode: input.mode,
        location: input.mode === 'online' ? 'Online' : 'University Library',
        status: 'proposed',
        safety_acknowledged: input.safetyAcknowledged,
      });
    }
    return id;
  }, [state.currentUserId]);

  const setSessionStatus = useCallback((sessionId: string, status: SessionStatus) => {
    setState((s) => ({
      ...s,
      sessions: s.sessions.map((x) => (x.id === sessionId ? { ...x, status } : x)),
    }));
    if (isSupabaseConfigured && supabase) {
      void supabase.from('study_sessions').update({ status }).eq('id', sessionId);
    }
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
    if (isSupabaseConfigured && supabase && state.currentUserId) {
      void supabase
        .from('blocks')
        .upsert({ blocker_id: state.currentUserId, blocked_id: targetId }, { onConflict: 'blocker_id,blocked_id' });
    }
  }, [state.currentUserId]);

  const reportUser = useCallback((input: ReportInput) => {
    const id = uid('report');
    setState((s) => {
      if (!s.currentUserId) return s;
      const report: Report = {
        id,
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
    if (isSupabaseConfigured && supabase && state.currentUserId) {
      void supabase.from('reports').insert({
        id,
        reporter_id: state.currentUserId,
        reported_id: input.reportedId,
        message_id: input.messageId || null,
        message_text: input.messageText || null,
        message_category: input.messageCategory || null,
        reason: input.reason,
        note: input.note || null,
        status: 'open',
      });
    }
  }, [state.currentUserId]);

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
