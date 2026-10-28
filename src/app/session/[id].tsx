import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Check, MapPin, ShieldCheck, Video, X } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText, Avatar, Button, Card, Header, Pill, Screen } from '@/components/ui';
import { useApp } from '@/lib/store';
import { formatDate, subjectLabel, to12h } from '@/lib/subjects';
import { colors, space } from '@/theme/tokens';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, currentStudent, matchFor, partnerOf, setSessionStatus } = useApp();

  const session = state.sessions.find((s) => s.id === id);
  const match = session ? matchFor(session.matchId) : undefined;
  const partner = match ? partnerOf(match) : undefined;

  if (!session || !match || !partner || !currentStudent) {
    return (
      <Screen>
        <Header title="Session" onBack={() => router.back()} />
        <AppText variant="body" color={colors.muted}>
          This session is no longer available.
        </AppText>
      </Screen>
    );
  }

  const mine = session.createdBy === currentStudent.profile.id;
  const canRespond = session.status === 'proposed' && !mine;
  const canComplete = session.status === 'confirmed';

  return (
    <Screen scroll>
      <Header title="Study session" onBack={() => router.back()} />

      <View style={{ gap: space.lg }}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Pill
              label={
                session.status === 'confirmed'
                  ? 'Confirmed'
                  : session.status === 'proposed'
                    ? 'Awaiting response'
                    : session.status === 'completed'
                      ? 'Completed'
                      : 'Cancelled'
              }
              tone={
                session.status === 'confirmed'
                  ? 'success'
                  : session.status === 'cancelled'
                    ? 'danger'
                    : 'warning'
              }
            />
            <AppText variant="caption" color={colors.muted}>
              {mine ? 'You proposed this' : `${partner.profile.name.split(' ')[0]} proposed this`}
            </AppText>
          </View>

          <AppText variant="h1">{subjectLabel(session.subjectId)}</AppText>

          <View style={{ gap: space.sm }}>
            <Row icon={<CalendarDays size={16} color={colors.muted} />}>
              {formatDate(session.date)} · {to12h(session.start)}–{to12h(session.end)}
            </Row>
            <Row icon={session.mode === 'online' ? <Video size={16} color={colors.muted} /> : <MapPin size={16} color={colors.muted} />}>
              {session.mode === 'online' ? 'Online video call' : session.location}
            </Row>
          </View>

          {session.mode === 'in_person' ? (
            <View
              style={{
                flexDirection: 'row',
                gap: space.sm,
                backgroundColor: colors.primarySoft,
                padding: space.md,
                borderRadius: 14,
              }}>
              <ShieldCheck size={16} color={colors.primary} />
              <AppText variant="caption" color={colors.primary} style={{ flex: 1 }}>
                In-person sessions happen only at the University Library. Never share your home
                address or meet elsewhere.
              </AppText>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Avatar name={currentStudent.profile.name} color={currentStudent.profile.avatarColor} size={36} />
            <Avatar name={partner.profile.name} color={partner.profile.avatarColor} size={36} />
            <AppText variant="caption" color={colors.muted}>
              {currentStudent.profile.name.split(' ')[0]} & {partner.profile.name.split(' ')[0]}
            </AppText>
          </View>
        </Card>

        {canRespond ? (
          <View style={{ gap: space.sm }}>
            <Button
              label="Accept session"
              icon={<Check size={18} color={colors.text} />}
              onPress={() => setSessionStatus(session.id, 'confirmed')}
            />
            <Button
              label="Decline"
              variant="secondary"
              icon={<X size={18} color={colors.text} />}
              onPress={() => setSessionStatus(session.id, 'cancelled')}
            />
          </View>
        ) : null}

        {canComplete ? (
          <View style={{ gap: space.sm }}>
            <Button
              label="Mark as completed"
              onPress={() => setSessionStatus(session.id, 'completed')}
            />
            <Button
              label="Cancel session"
              variant="danger"
              onPress={() => setSessionStatus(session.id, 'cancelled')}
            />
          </View>
        ) : null}

        <Button
          label="Back to chat"
          variant="secondary"
          onPress={() => router.replace(`/chat/${match.id}`)}
        />
      </View>

      <View style={{ height: 40 }} />
    </Screen>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
      {icon}
      <AppText variant="small" color={colors.muted}>
        {children}
      </AppText>
    </View>
  );
}
