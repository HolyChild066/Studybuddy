import { router } from 'expo-router';
import {
  BadgeCheck,
  BookOpen,
  CalendarDays,
  ChevronRight,
  LogOut,
  Pencil,
  RefreshCcw,
  TrendingUp,
  Users,
} from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { ConfirmDialog } from '@/components/confirm-dialog';
import {
  AppText,
  Avatar,
  Button,
  Card,
  Chip,
  Divider,
  Pill,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { useApp } from '@/lib/store';
import { DAY_LABELS, STUDY_PREF_LABEL, subjectLabel, to12h } from '@/lib/subjects';
import { colors, radius, space } from '@/theme/tokens';
import type { SubjectKind } from '@/lib/types';

const KIND_LABEL: Record<SubjectKind, string> = {
  can_help: 'Can help with',
  need_help: 'Needs help with',
  want_study: 'Wants to study',
};

export default function ProfileScreen() {
  const { currentStudent, state, myMatches, signOut, switchUser, resetDemo } = useApp();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  if (!currentStudent) return null;
  const profile = currentStudent.profile;
  const completed = state.sessions.filter((s) => s.status === 'completed').length;
  const progress = state.learningProgress[profile.id];

  const others = Object.values(state.students).filter(
    (s) => s.profile.id !== profile.id && s.profile.verification === 'approved',
  );

  return (
    <Screen scroll>
      <View style={{ paddingTop: space.lg, gap: space.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="h1">Profile</AppText>
          <Pressable
            onPress={() => router.push('/edit-profile')}
            style={{
              height: 40,
              paddingHorizontal: space.md,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}>
            <Pencil size={14} color={colors.text} />
            <AppText variant="caption">Edit</AppText>
          </Pressable>
        </View>

        <Card style={{ alignItems: 'center', gap: space.sm }}>
          <Avatar name={profile.name} color={profile.avatarColor} size={88} ring />
          <AppText variant="h2">{profile.name}</AppText>
          <AppText variant="caption" color={colors.muted}>
            {profile.course} · Year {profile.year}
          </AppText>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Pill
              label={profile.verification === 'approved' ? 'Verified student' : 'Unverified'}
              tone={profile.verification === 'approved' ? 'success' : 'warning'}
            />
            <Pill label={`${STUDY_PREF_LABEL[profile.studyPref]} sessions`} tone="primary" />
          </View>
          {profile.bio ? (
            <AppText variant="small" color={colors.muted} align="center">
              {profile.bio}
            </AppText>
          ) : (
            <Pressable onPress={() => router.push('/edit-profile')}>
              <AppText variant="caption" color={colors.primary}>
                Add a short academic bio
              </AppText>
            </Pressable>
          )}
        </Card>

        <View style={{ flexDirection: 'row', gap: space.md }}>
          <MiniStat icon={<Users size={16} color={colors.primary} />} value={String(myMatches.length)} label="Matches" />
          <MiniStat icon={<CalendarDays size={16} color={colors.success} />} value={String(completed)} label="Sessions" />
          <MiniStat icon={<BookOpen size={16} color={colors.accent} />} value={String(currentStudent.subjects.length)} label="Subjects" />
        </View>

        <Card>
          <SectionHeader title="Learning progress" />
          {progress ? (
            <View style={{ gap: space.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="small">Confidence level</AppText>
                <AppText variant="small" style={{ fontWeight: '600' }}>
                  {progress.confidenceAfter ?? progress.confidenceBefore ?? 3}/5
                </AppText>
              </View>
              {progress.topics.map((t) => (
                  <AppText
                    key={t.name}
                    variant="small"
                    style={{ marginRight: space.sm, color: t.status === 'done' ? colors.success : t.status === 'learning' ? colors.warning : colors.muted }}
                  >
                    {t.name}
                  </AppText>
                ))}
            </View>
          ) : (
            <AppText variant="caption" color={colors.muted}>
              No progress tracked yet.
            </AppText>
          )}
        </Card>

        <Card>
          <SectionHeader
            title="Academic subjects"
            action={
              <Pressable onPress={() => router.push('/edit-profile')}>
                <AppText variant="caption" color={colors.primary}>
                  Manage
                </AppText>
              </Pressable>
            }
          />
          {(['can_help', 'need_help', 'want_study'] as SubjectKind[]).map((kind) => {
            const entries = currentStudent.subjects.filter((s) => s.kind === kind);
            return (
              <View key={kind} style={{ gap: 6 }}>
                <AppText variant="label" color={colors.muted}>
                  {KIND_LABEL[kind].toUpperCase()}
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {entries.length ? (
                    entries.map((e) => (
                      <Chip
                        key={`${kind}-${e.subjectId}`}
                        label={subjectLabel(e.subjectId)}
                        tone={kind === 'can_help' ? 'success' : kind === 'need_help' ? 'primary' : 'default'}
                      />
                    ))
                  ) : (
                    <AppText variant="caption" color={colors.muted}>
                      Not set
                    </AppText>
                  )}
                </View>
              </View>
            );
          })}
        </Card>

        <Card>
          <SectionHeader
            title="Availability"
            action={
              <Pressable onPress={() => router.push('/edit-profile')}>
                <AppText variant="caption" color={colors.primary}>
                  Edit
                </AppText>
              </Pressable>
            }
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {currentStudent.availability.length ? (
              currentStudent.availability.map((a, i) => (
                <Chip
                  key={`${a.day}-${i}`}
                  label={`${DAY_LABELS[a.day]} ${to12h(a.start)}–${to12h(a.end)}`}
                />
              ))
            ) : (
              <AppText variant="caption" color={colors.muted}>
                No availability added yet.
              </AppText>
            )}
          </View>
        </Card>

        <Card tone="flat" style={{ padding: 0, gap: 0 }}>
          <MenuRow
            icon={<Pencil size={16} color={colors.text} />}
            label="Edit academic profile"
            onPress={() => router.push('/edit-profile')}
          />
          <Divider />
          <MenuRow
            icon={<Users size={16} color={colors.text} />}
            label="Switch demo user"
            caption="Test both sides of a match on one device"
            onPress={() => setSwitcherOpen(true)}
          />
          <Divider />
          <MenuRow
            icon={<RefreshCcw size={16} color={colors.muted} />}
            label="Reset demo data"
            onPress={() => setResetOpen(true)}
          />
          <Divider />
          <MenuRow
            icon={<LogOut size={16} color={colors.danger} />}
            label="Sign out"
            danger
            onPress={() => {
              signOut();
              router.replace('/welcome');
            }}
          />
        </Card>

        <View style={{ alignItems: 'center', gap: 4, paddingVertical: space.md }}>
          <BadgeCheck size={16} color={colors.border} />
          <AppText variant="caption" color={colors.muted}>
            StudyMate · One campus, verified students
          </AppText>
        </View>
      </View>

      <View style={{ height: 110 }} />

      <Modal
        visible={switcherOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setSwitcherOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: colors.bg,
              borderTopLeftRadius: radius.xxl,
              borderTopRightRadius: radius.xxl,
              padding: space.xl,
              gap: space.md,
            }}>
            <AppText variant="h2">Switch demo user</AppText>
            <AppText variant="caption" color={colors.muted}>
              Sign in as another seeded student to accept a request, reply, or confirm a session.
            </AppText>

            {others.map((s) => (
              <Pressable
                key={s.profile.id}
                onPress={() => {
                  switchUser(s.profile.id);
                  setSwitcherOpen(false);
                  router.replace('/home');
                }}>
                <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md }}>
                  <Avatar name={s.profile.name} color={s.profile.avatarColor} size={40} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="h3">{s.profile.name}</AppText>
                    <AppText variant="caption" color={colors.muted}>
                      {s.profile.course.replace('BS ', '')} · Year {s.profile.year}
                    </AppText>
                  </View>
                  <ChevronRight size={18} color={colors.border} />
                </Card>
              </Pressable>
            ))}

            <Button label="Cancel" variant="ghost" onPress={() => setSwitcherOpen(false)} />
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={resetOpen}
        title="Reset demo data?"
        message="This clears matches, messages, sessions, blocks, and reports stored on this device."
        confirmLabel="Reset everything"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          resetDemo();
          setResetOpen(false);
          router.replace('/welcome');
        }}
      />
    </Screen>
  );
}

function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.xl,
        padding: space.md,
        gap: 4,
      }}>
      {icon}
      <AppText variant="h3">{value}</AppText>
      <AppText variant="caption" color={colors.muted}>
        {label}
      </AppText>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  caption,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  caption?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        padding: space.lg,
      }}>
      {icon}
      <View style={{ flex: 1 }}>
        <AppText variant="small" color={danger ? colors.danger : colors.text}>
          {label}
        </AppText>
        {caption ? (
          <AppText variant="caption" color={colors.muted}>
            {caption}
          </AppText>
        ) : null}
      </View>
      <ChevronRight size={16} color={colors.border} />
    </Pressable>
  );
}
