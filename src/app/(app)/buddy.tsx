import { router } from 'expo-router';
import { Handshake, Sparkles, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText, Avatar, Button, Card, Chip, EmptyState, Pill, Screen } from '@/components/ui';
import { useApp } from '@/lib/store';
import { DAY_LABELS, subjectLabel, to12h } from '@/lib/subjects';
import type { Student, SubjectEntry } from '@/lib/types';
import { colors, radius, space } from '@/theme/tokens';

function idsFor(entries: SubjectEntry[], kind: SubjectEntry['kind']) {
  return entries.filter((e) => e.kind === kind).map((e) => e.subjectId);
}

export default function BuddyScreen() {
  const { currentStudent, deck, decide } = useApp();
  const [banner, setBanner] = useState<string | null>(null);

  if (!currentStudent) return null;

  const top = deck[0];

  if (!top) {
    return (
      <Screen>
        <View style={{ paddingTop: space.lg, gap: space.sm }}>
          <AppText variant="h1">Find a buddy</AppText>
          <AppText variant="small" color={colors.muted}>
            Ranked by subject exchange, availability, and study mode.
          </AppText>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            emoji="🔍"
            title="No compatible StudyBuddy found"
            body="Don't worry — you can try again later. Adding more subjects or availability helps."
            action={
              <View style={{ gap: space.sm }}>
                <Button label="Update my subjects" onPress={() => router.push('/edit-profile')} />
                <Button
                  label="Update availability"
                  variant="secondary"
                  onPress={() => router.push('/edit-profile')}
                />
              </View>
            }
          />
        </View>
      </Screen>
    );
  }

  const other = top.student;
  const theyHelpYou = idsFor(other.subjects, 'can_help').filter((id) =>
    idsFor(currentStudent.subjects, 'need_help').includes(id),
  );
  const youHelpThem = idsFor(currentStudent.subjects, 'can_help').filter((id) =>
    idsFor(other.subjects, 'need_help').includes(id),
  );

  const handle = (action: 'pass' | 'study') => {
    const matchId = decide(other.profile.id, action);
    if (matchId) {
      router.push(`/match/${matchId}`);
      return;
    }
    setBanner(
      action === 'study'
        ? `Study request sent to ${other.profile.name.split(' ')[0]}. You'll match when they study you back.`
        : `Passed on ${other.profile.name.split(' ')[0]}.`,
    );
  };

  return (
    <Screen scroll>
      <View style={{ paddingTop: space.lg, gap: 6 }}>
        <AppText variant="h1">Find a buddy</AppText>
        <AppText variant="small" color={colors.muted}>
          {deck.length} compatible {deck.length === 1 ? 'student' : 'students'} · ranked by academic fit
        </AppText>
      </View>

      {banner ? (
        <Pressable onPress={() => setBanner(null)} style={{ marginTop: space.md }}>
          <Card tone="tint">
            <AppText variant="caption" color={colors.primary}>
              {banner}
            </AppText>
          </Card>
        </Pressable>
      ) : null}

      <View style={{ marginTop: space.lg }}>
        <Card style={{ gap: space.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flexDirection: 'row', gap: space.md, flex: 1 }}>
              <Avatar name={other.profile.name} color={other.profile.avatarColor} size={64} />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="h2">{other.profile.name}</AppText>
                <AppText variant="caption" color={colors.muted}>
                  {other.profile.course} · Year {other.profile.year}
                </AppText>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <Pill label={`${Math.round(top.score)}% match`} tone="primary" />
                  {top.reciprocal ? <Pill label="Skill exchange" tone="success" /> : null}
                </View>
              </View>
            </View>
          </View>

          {other.profile.bio ? (
            <AppText variant="small" color={colors.muted}>
              {other.profile.bio}
            </AppText>
          ) : null}

          {top.reciprocal ? (
            <View
              style={{
                flexDirection: 'row',
                gap: space.sm,
                alignItems: 'center',
                backgroundColor: colors.successSoft,
                borderRadius: radius.md,
                padding: space.md,
              }}>
              <Sparkles size={16} color={colors.success} />
              <AppText variant="caption" color={colors.success} style={{ flex: 1 }}>
                You both have something to teach and something to learn.
              </AppText>
            </View>
          ) : null}

          <View style={{ gap: space.sm }}>
            {theyHelpYou.length ? (
              <View style={{ gap: 6 }}>
                <AppText variant="label" color={colors.muted}>
                  CAN HELP YOU WITH
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {theyHelpYou.map((id) => (
                    <Chip key={id} label={subjectLabel(id)} tone="success" />
                  ))}
                </View>
              </View>
            ) : null}

            {youHelpThem.length ? (
              <View style={{ gap: 6 }}>
                <AppText variant="label" color={colors.muted}>
                  YOU CAN HELP WITH
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {youHelpThem.map((id) => (
                    <Chip key={id} label={subjectLabel(id)} tone="primary" />
                  ))}
                </View>
              </View>
            ) : null}

            {!theyHelpYou.length && !youHelpThem.length ? (
              <AppText variant="caption" color={colors.muted}>
                Shared interest · {top.sharedSubjectIds.map(subjectLabel).join(', ') || 'Open to studying'}
              </AppText>
            ) : null}
          </View>

          <View style={{ gap: 6 }}>
            <AppText variant="label" color={colors.muted}>
              OVERLAPPING AVAILABILITY
            </AppText>
            <AvailabilityLine me={currentStudent} them={other} />
          </View>

          <View style={{ flexDirection: 'row', gap: space.md }}>
            <Button
              label="Pass"
              variant="secondary"
              style={{ flex: 1 }}
              icon={<X size={18} color={colors.text} />}
              onPress={() => handle('pass')}
            />
            <Button
              label="Study"
              style={{ flex: 1 }}
              icon={<Handshake size={18} color={colors.text} />}
              onPress={() => handle('study')}
            />
          </View>

          <Pressable onPress={() => router.push(`/buddy-profile/${other.profile.id}`)}>
            <AppText variant="caption" color={colors.primary} align="center">
              View full academic profile
            </AppText>
          </Pressable>
        </Card>

        {deck[1] ? (
          <View style={{ marginTop: space.lg, gap: space.sm }}>
            <AppText variant="label" color={colors.muted}>
              ALSO COMPATIBLE
            </AppText>
            <Card tone="flat" style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Avatar
                name={deck[1].student.profile.name}
                color={deck[1].student.profile.avatarColor}
                size={40}
              />
              <View style={{ flex: 1 }}>
                <AppText variant="h3">{deck[1].student.profile.name}</AppText>
                <AppText variant="caption" color={colors.muted}>
                  {Math.round(deck[1].score)}% match · {deck[1].student.profile.course.replace('BS ', '')}
                </AppText>
              </View>
              <Pill label="Next" tone="neutral" />
            </Card>
          </View>
        ) : null}
      </View>

      <View style={{ height: 110 }} />
    </Screen>
  );
}

function AvailabilityLine({ me, them }: { me: Student; them: Student }) {
  const overlaps: string[] = [];
  for (const a of me.availability) {
    for (const b of them.availability) {
      if (a.day === b.day) {
        const start = a.start > b.start ? a.start : b.start;
        const end = a.end < b.end ? a.end : b.end;
        if (start < end) {
          overlaps.push(`${DAY_LABELS[a.day]} ${to12h(start)}–${to12h(end)}`);
        }
      }
    }
  }
  if (!overlaps.length) {
    return (
      <AppText variant="caption" color={colors.muted}>
        No overlapping blocks yet — you can still match and compare notes.
      </AppText>
    );
  }
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {[...new Set(overlaps)].slice(0, 3).map((o) => (
        <Chip key={o} label={o} />
      ))}
    </View>
  );
}
