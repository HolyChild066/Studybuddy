import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, MapPin, ShieldCheck, Video } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { SafetyNotice } from '@/components/safety-notice';
import {
  AppText,
  Button,
  Card,
  Chip,
  Header,
  Pill,
  Screen,
} from '@/components/ui';
import { useApp } from '@/lib/store';
import { formatDate, subjectLabel, to12h } from '@/lib/subjects';
import type { SessionMode } from '@/lib/types';
import { colors, space } from '@/theme/tokens';

const DURATIONS = [60, 90, 120];

function isoDate(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export default function NewSessionScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { matchFor, partnerOf, currentStudent, createSession, sendMessage, isBlockedWith } =
    useApp();

  const match = matchId ? matchFor(matchId) : undefined;
  const partner = match ? partnerOf(match) : undefined;

  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(isoDate(1));
  const [start, setStart] = useState('18:00');
  const [duration, setDuration] = useState(60);
  const [mode, setMode] = useState<SessionMode>('in_person');
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => isoDate(i + 1)), []);

  const subjectOptions = useMemo(() => {
    if (!currentStudent || !partner) return [];
    const ids = new Set<string>();
    currentStudent.subjects.forEach((s) => ids.add(s.subjectId));
    partner.subjects.forEach((s) => {
      if (s.kind === 'can_help') ids.add(s.subjectId);
    });
    return [...ids];
  }, [currentStudent, partner]);

  if (!match || !partner || !currentStudent) {
    return (
      <Screen>
        <Header title="New session" onBack={() => router.back()} />
        <AppText variant="body" color={colors.muted}>
          This conversation is no longer available.
        </AppText>
      </Screen>
    );
  }

  if (isBlockedWith(partner.profile.id)) {
    return (
      <Screen>
        <Header title="New session" onBack={() => router.back()} />
        <AppText variant="body" color={colors.muted}>
          You cannot book a session with this user.
        </AppText>
      </Screen>
    );
  }

  const chosenSubject = subjectId || subjectOptions[0] || '';
  const end = addMinutes(start, duration);
  const canConfirm = Boolean(chosenSubject) && (mode === 'online' || acknowledged);

  const confirm = () => {
    const id = createSession({
      matchId: match.id,
      subjectId: chosenSubject,
      date,
      start,
      end,
      mode,
      safetyAcknowledged: mode === 'in_person' ? acknowledged : true,
    });

    sendMessage(match.id, 'does_time_work', {
      sessionId: id,
      subjectId: chosenSubject,
    });
    router.replace(`/chat/${match.id}`);
  };

  return (
    <Screen scroll>
      <Header
        title="Schedule a session"
        subtitle={`With ${partner.profile.name}`}
        onBack={() => router.back()}
      />

      <View style={{ gap: space.lg }}>
        <Card>
          <AppText variant="label" color={colors.muted}>
            SUBJECT
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {subjectOptions.map((id) => (
              <Chip
                key={id}
                label={subjectLabel(id)}
                active={chosenSubject === id}
                onPress={() => setSubjectId(id)}
              />
            ))}
          </View>
        </Card>

        <Card>
          <AppText variant="label" color={colors.muted}>
            DATE
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {dates.map((d) => (
              <Chip
                key={d}
                label={formatDate(d)}
                active={date === d}
                onPress={() => setDate(d)}
              />
            ))}
          </View>
        </Card>

        <Card>
          <AppText variant="label" color={colors.muted}>
            START TIME
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {['09:00', '10:00', '12:00', '14:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(
              (t) => (
                <Chip key={t} label={to12h(t)} active={start === t} onPress={() => setStart(t)} />
              ),
            )}
          </View>

          <AppText variant="label" color={colors.muted} style={{ marginTop: space.sm }}>
            DURATION
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {DURATIONS.map((d) => (
              <Chip
                key={d}
                label={`${d} min`}
                active={duration === d}
                onPress={() => setDuration(d)}
              />
            ))}
          </View>

          <AppText variant="caption" color={colors.muted}>
            {formatDate(date)} · {to12h(start)}–{to12h(end)}
          </AppText>
        </Card>

        <Card>
          <AppText variant="label" color={colors.muted}>
            MODE
          </AppText>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Chip
              label="Online"
              emoji="💻"
              active={mode === 'online'}
              onPress={() => setMode('online')}
            />
            <Chip
              label="In-person"
              emoji="🏫"
              active={mode === 'in_person'}
              onPress={() => setMode('in_person')}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.sm,
              backgroundColor: colors.surfaceAlt,
              padding: space.md,
              borderRadius: 14,
            }}>
            {mode === 'online' ? (
              <Video size={16} color={colors.primary} />
            ) : (
              <MapPin size={16} color={colors.primary} />
            )}
            <AppText variant="caption" color={colors.primary}>
              {mode === 'online' ? 'Video call link shared in chat' : 'University Library only'}
            </AppText>
          </View>

          {mode === 'in_person' ? (
            <View style={{ gap: space.sm }}>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <ShieldCheck size={16} color={acknowledged ? colors.success : colors.warning} />
                <AppText
                  variant="caption"
                  color={acknowledged ? colors.success : colors.muted}
                  style={{ flex: 1 }}>
                  {acknowledged
                    ? 'Safety notice acknowledged. Location fixed to the University Library.'
                    : 'You must read and acknowledge the safety notice before confirming an in-person session.'}
                </AppText>
              </View>
              {!acknowledged ? (
                <Button
                  label="Read safety notice"
                  variant="secondary"
                  onPress={() => setSafetyOpen(true)}
                />
              ) : null}
            </View>
          ) : null}
        </Card>

        <Card tone="tint">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <CalendarDays size={16} color={colors.primary} />
            <Pill label="Proposed" tone="warning" />
          </View>
          <AppText variant="caption" color={colors.primary}>
            {partner.profile.name.split(' ')[0]} will see this session card in chat and can accept
            or decline it.
          </AppText>
        </Card>
      </View>

      <View style={{ marginTop: space.xxl }}>
        <Button
          label="Send session invite"
          disabled={!canConfirm}
          onPress={() => {
            if (mode === 'in_person' && !acknowledged) {
              setSafetyOpen(true);
              return;
            }
            confirm();
          }}
        />
      </View>

      <View style={{ height: 40 }} />

      <SafetyNotice
        visible={safetyOpen}
        onCancel={() => setSafetyOpen(false)}
        onAcknowledge={() => {
          setAcknowledged(true);
          setSafetyOpen(false);
        }}
      />
    </Screen>
  );
}
