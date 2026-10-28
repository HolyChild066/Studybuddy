import { router } from 'expo-router';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  MapPin,
  MessageCircle,
  Users,
  Video,
} from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import {
  AppText,
  Avatar,
  Button,
  Card,
  Chip,
  Pill,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { useApp } from '@/lib/store';
import { DAY_LABELS, formatDate, to12h } from '@/lib/subjects';
import { colors, radius, space } from '@/theme/tokens';

export default function HomeScreen() {
  const { currentStudent, myMatches, partnerOf, state } = useApp();
  if (!currentStudent) return null;

  const partner = myMatches[0] ? partnerOf(myMatches[0]) : undefined;
  const sessions = state.sessions
    .filter((s) => myMatches.some((m) => m.id === s.matchId))
    .filter((s) => s.status !== 'cancelled')
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
  const upcoming = sessions[0];

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const completed = state.sessions.filter((s) => s.status === 'completed').length;

  return (
    <Screen scroll>
      <View style={{ paddingTop: space.lg, gap: space.xl }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="h1">Hey, {currentStudent.profile.name.split(' ')[0]}</AppText>
            <AppText variant="caption" color={colors.muted}>
              {today} · A fresh start awaits
            </AppText>
          </View>
          <Pressable onPress={() => router.push('/profile')}>
            <Avatar
              name={currentStudent.profile.name}
              color={currentStudent.profile.avatarColor}
              size={48}
            />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
          <Chip label="Verified student" emoji="🎓" tone="success" />
          <Chip
            label={`Year ${currentStudent.profile.year} · ${currentStudent.profile.course.replace('BS ', '')}`}
          />
        </View>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText variant="label" color={colors.muted}>
              YOUR NEXT STEP
            </AppText>
            <Pill label={myMatches.length ? 'Matched' : 'Find a buddy'} tone="primary" />
          </View>

          {partner ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <Avatar name={partner.profile.name} color={partner.profile.avatarColor} size={52} />
                <View style={{ flex: 1 }}>
                  <AppText variant="h3">{partner.profile.name}</AppText>
                  <AppText variant="caption" color={colors.muted}>
                    You matched on {partner.profile.course.replace('BS ', '')}
                  </AppText>
                </View>
              </View>
              <Button
                label="Open guided chat"
                icon={<MessageCircle size={18} color={colors.text} />}
                onPress={() => router.push(`/chat/${myMatches[0]!.id}`)}
              />
            </>
          ) : (
            <>
              <AppText variant="h3">Find your first study buddy</AppText>
              <AppText variant="small" color={colors.muted}>
                We compare subjects, availability, and study mode. Reciprocal help ranks highest.
              </AppText>
              <Button
                label="Browse study buddies"
                icon={<Users size={18} color={colors.text} />}
                onPress={() => router.push('/buddy')}
              />
            </>
          )}
        </Card>

        {upcoming ? (
          <Card tone="tint">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <CalendarDays size={16} color={colors.primary} />
              <AppText variant="label" color={colors.primary}>
                UPCOMING SESSION
              </AppText>
            </View>
            <AppText variant="h3">
              {upcoming.mode === 'online' ? 'Online study session' : 'Library study session'}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <CalendarDays size={14} color={colors.muted} />
                <AppText variant="caption" color={colors.muted}>
                  {formatDate(upcoming.date)} · {to12h(upcoming.start)}–{to12h(upcoming.end)}
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {upcoming.mode === 'online' ? (
                  <Video size={14} color={colors.muted} />
                ) : (
                  <MapPin size={14} color={colors.muted} />
                )}
                <AppText variant="caption" color={colors.muted}>
                  {upcoming.location}
                </AppText>
              </View>
            </View>
            <Button
              label="View session"
              variant="secondary"
              onPress={() => router.push(`/session/${upcoming.id}`)}
            />
          </Card>
        ) : null}

        <View style={{ flexDirection: 'row', gap: space.md }}>
          <StatCard icon={<Users size={16} color={colors.primary} />} value={String(myMatches.length)} label="Matches" />
          <StatCard icon={<CalendarDays size={16} color={colors.success} />} value={String(completed)} label="Sessions" />
          <StatCard
            icon={<BookOpen size={16} color={colors.accent} />}
            value={String(currentStudent.subjects.length)}
            label="Subjects"
          />
        </View>

        <View style={{ gap: space.md }}>
          <SectionHeader title="How StudyMate works" />
          <Step
            n={1}
            title="Get matched on academics"
            body="Subjects, needs, availability, and study mode — never looks."
          />
          <Step
            n={2}
            title="Talk with guided messages"
            body="No free-text chat. Pick a prompt, stay academic, stay safe."
          />
          <Step
            n={3}
            title="Study at the library or online"
            body="In-person sessions are limited to the University Library."
          />
        </View>

        {currentStudent.availability.length ? (
          <Card tone="flat">
            <SectionHeader title="Your availability" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {currentStudent.availability.map((a, i) => (
                <Chip
                  key={`${a.day}-${i}`}
                  label={`${DAY_LABELS[a.day]} ${to12h(a.start)}–${to12h(a.end)}`}
                />
              ))}
            </View>
          </Card>
        ) : null}
      </View>

      <View style={{ height: 110 }} />
    </Screen>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.xl,
        padding: space.md,
        gap: 6,
      }}>
      {icon}
      <AppText variant="h2">{value}</AppText>
      <AppText variant="caption" color={colors.muted}>
        {label}
      </AppText>
    </View>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <AppText variant="label" color={colors.primary}>
          {n}
        </AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="h3">{title}</AppText>
        <AppText variant="caption" color={colors.muted}>
          {body}
        </AppText>
      </View>
      <ArrowRight size={16} color={colors.border} style={{ marginTop: 6 }} />
    </View>
  );
}
