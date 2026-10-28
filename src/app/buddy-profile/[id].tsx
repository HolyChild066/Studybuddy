import { router, useLocalSearchParams } from 'expo-router';
import { Ban, Flag, Handshake, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { ReportSheet } from '@/components/report-sheet';
import { AppText, Avatar, Button, Card, Chip, Header, Pill, Screen, SectionHeader } from '@/components/ui';
import { useApp } from '@/lib/store';
import { DAY_LABELS, subjectLabel, to12h } from '@/lib/subjects';
import { colors, radius, space } from '@/theme/tokens';

export default function BuddyProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { studentById, currentStudent, scoreFor, decide, blockUser, reportUser } = useApp();
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const other = id ? studentById(id) : undefined;
  const score = id ? scoreFor(id) : null;

  if (!other || !currentStudent) {
    return (
      <Screen>
        <Header title="Profile" onBack={() => router.back()} />
        <AppText variant="body" color={colors.muted}>
          This profile is no longer available.
        </AppText>
      </Screen>
    );
  }

  const theyHelpYou = other.subjects.filter(
    (e) => e.kind === 'can_help' && currentStudent.subjects.some((s) => s.subjectId === e.subjectId && s.kind === 'need_help'),
  );
  const youHelpThem = other.subjects.filter(
    (e) => e.kind === 'need_help' && currentStudent.subjects.some((s) => s.subjectId === e.subjectId && s.kind === 'can_help'),
  );

  return (
    <Screen scroll>
      <Header
        title="Academic profile"
        onBack={() => router.back()}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Report user"
            onPress={() => setReportOpen(true)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Flag size={18} color={colors.muted} />
          </Pressable>
        }
      />

      <View style={{ gap: space.lg }}>
        <Card style={{ alignItems: 'center', gap: space.sm }}>
          <Avatar name={other.profile.name} color={other.profile.avatarColor} size={88} ring />
          <AppText variant="h2">{other.profile.name}</AppText>
          <AppText variant="caption" color={colors.muted}>
            {other.profile.course} · Year {other.profile.year}
          </AppText>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Pill label="Verified student" tone="success" />
            {score ? <Pill label={`${Math.round(score.score)}% match`} tone="primary" /> : null}
            {score?.reciprocal ? <Pill label="Skill exchange" tone="success" /> : null}
          </View>
          {other.profile.bio ? (
            <AppText variant="small" color={colors.muted} align="center">
              {other.profile.bio}
            </AppText>
          ) : null}
        </Card>

        {score ? (
          <Card tone="flat">
            <SectionHeader title="Why this match" />
            {(
              [
                ['Subject compatibility', score.breakdown.subject, 50],
                ['Availability', score.breakdown.availability, 15],
                ['Study preference', score.breakdown.preference, 15],
                ['Course', score.breakdown.course, 10],
                ['Year level', score.breakdown.year, 10],
              ] as const
            ).map(([label, value, max]) => (
              <View key={label} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText variant="caption" color={colors.muted}>
                    {label}
                  </AppText>
                  <AppText variant="caption" color={colors.muted}>
                    {value}/{max}
                  </AppText>
                </View>
                <View
                  style={{
                    height: 6,
                    borderRadius: 6,
                    backgroundColor: colors.border,
                    overflow: 'hidden',
                  }}>
                  <View
                    style={{
                      width: `${Math.round((value / max) * 100)}%`,
                      height: 6,
                      backgroundColor: colors.primary,
                    }}
                  />
                </View>
              </View>
            ))}
          </Card>
        ) : null}

        <Card>
          <SectionHeader title="Subjects" />
          {theyHelpYou.length ? (
            <SubjectRow label="Can help you with" ids={theyHelpYou.map((s) => s.subjectId)} tone="success" />
          ) : null}
          {youHelpThem.length ? (
            <SubjectRow label="You can help with" ids={youHelpThem.map((s) => s.subjectId)} tone="primary" />
          ) : null}
          <SubjectRow
            label="Can help with"
            ids={other.subjects.filter((s) => s.kind === 'can_help').map((s) => s.subjectId)}
          />
          <SubjectRow
            label="Needs help with"
            ids={other.subjects.filter((s) => s.kind === 'need_help').map((s) => s.subjectId)}
          />
        </Card>

        <Card>
          <SectionHeader title="Availability" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {other.availability.length ? (
              other.availability.map((a, i) => (
                <Chip
                  key={`${a.day}-${i}`}
                  label={`${DAY_LABELS[a.day]} ${to12h(a.start)}–${to12h(a.end)}`}
                />
              ))
            ) : (
              <AppText variant="caption" color={colors.muted}>
                No availability shared yet.
              </AppText>
            )}
          </View>
          <AppText variant="caption" color={colors.muted}>
            Study preference: {other.profile.studyPref.replace('_', '-')}
          </AppText>
        </Card>

        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Button
            label="Pass"
            variant="secondary"
            style={{ flex: 1 }}
            icon={<X size={18} color={colors.text} />}
            onPress={() => {
              decide(other.profile.id, 'pass');
              router.back();
            }}
          />
          <Button
            label="Study"
            style={{ flex: 1 }}
            icon={<Handshake size={18} color={colors.text} />}
            onPress={() => {
              const matchId = decide(other.profile.id, 'study');
              if (matchId) router.replace(`/match/${matchId}`);
              else setInfoOpen(true);
            }}
          />
        </View>

        <Pressable
          onPress={() => setBlockOpen(true)}
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            padding: space.md,
          }}>
          <Ban size={15} color={colors.danger} />
          <AppText variant="caption" color={colors.danger}>
            Block this user
          </AppText>
        </Pressable>
      </View>

      <View style={{ height: 110 }} />

      <ReportSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={(reason, note) =>
          reportUser({ reportedId: other.profile.id, reason, note })
        }
      />

      <ConfirmDialog
        visible={blockOpen}
        title={`Block ${other.profile.name}?`}
        message="You will no longer appear in each other's matches, and neither of you can send messages or session invites."
        confirmLabel="Block user"
        danger
        onCancel={() => setBlockOpen(false)}
        onConfirm={() => {
          blockUser(other.profile.id);
          setBlockOpen(false);
          router.replace('/buddy');
        }}
      />

      <ConfirmDialog
        visible={infoOpen}
        title="Study request sent"
        message={`You'll match with ${other.profile.name.split(' ')[0]} when they study you back.`}
        confirmLabel="Got it"
        cancelLabel="Keep browsing"
        onCancel={() => {
          setInfoOpen(false);
          router.back();
        }}
        onConfirm={() => {
          setInfoOpen(false);
          router.back();
        }}
      />
    </Screen>
  );
}

function SubjectRow({
  label,
  ids,
  tone = 'default',
}: {
  label: string;
  ids: string[];
  tone?: 'default' | 'primary' | 'success';
}) {
  return (
    <View style={{ gap: 6 }}>
      <AppText variant="label" color={colors.muted}>
        {label.toUpperCase()}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {ids.length ? (
          ids.map((id) => <Chip key={id} label={subjectLabel(id)} tone={tone} />)
        ) : (
          <AppText variant="caption" color={colors.muted}>
            None
          </AppText>
        )}
      </View>
    </View>
  );
}
