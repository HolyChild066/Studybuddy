import { router, useLocalSearchParams } from 'expo-router';
import { ShieldCheck, Sparkles } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText, Avatar, Button, Card, Chip, Header, Screen } from '@/components/ui';
import { useApp } from '@/lib/store';
import { subjectLabel } from '@/lib/subjects';
import { colors, space } from '@/theme/tokens';

export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { matchFor, partnerOf, currentStudent, scoreFor } = useApp();
  const match = id ? matchFor(id) : undefined;
  const partner = match ? partnerOf(match) : undefined;
  const score = partner ? scoreFor(partner.profile.id) : null;

  if (!match || !partner || !currentStudent) {
    return (
      <Screen>
        <Header title="Match" onBack={() => router.back()} />
        <AppText variant="body" color={colors.muted}>
          This match is no longer available.
        </AppText>
      </Screen>
    );
  }

  const shared = score?.sharedSubjectIds ?? [];

  return (
    <Screen scroll>
      <Header title="A good connection." onBack={() => router.back()} />

      <View style={{ alignItems: 'center', gap: space.lg, paddingVertical: space.xl }}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ marginRight: -16 }}>
            <Avatar
              name={currentStudent.profile.name}
              color={currentStudent.profile.avatarColor}
              size={84}
              ring
            />
          </View>
          <Avatar name={partner.profile.name} color={partner.profile.avatarColor} size={84} ring />
        </View>

        <Chip label="Study match" emoji="🤝" tone="success" />

        <AppText variant="display" align="center">
          It's a match
        </AppText>
        <AppText variant="body" color={colors.muted} align="center">
          You and {partner.profile.name.split(' ')[0]} have a few good things in common. Start with
          a hello.
        </AppText>
      </View>

      <Card>
        <AppText variant="h3">Your common ground</AppText>
        <View style={{ gap: 6 }}>
          <AppText variant="label" color={colors.muted}>
            SHARED SUBJECTS
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {shared.length ? (
              shared.map((s) => <Chip key={s} label={subjectLabel(s)} tone="primary" />)
            ) : (
              <Chip label="Open to studying" />
            )}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Sparkles size={14} color={colors.success} />
          <AppText variant="caption" color={colors.success}>
            {score?.reciprocal
              ? 'Reciprocal skill exchange — you can both teach and learn.'
              : 'One-way help match — still a strong academic fit.'}
          </AppText>
        </View>
        {score ? (
          <AppText variant="caption" color={colors.muted}>
            Match score {Math.round(score.score)}% · {score.overlapMinutes} minutes of overlapping
            availability
          </AppText>
        ) : null}
      </Card>

      <Card tone="tint" style={{ marginTop: space.lg }}>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <ShieldCheck size={16} color={colors.primary} style={{ marginTop: 1 }} />
          <AppText variant="caption" color={colors.primary} style={{ flex: 1 }}>
            <AppText variant="caption" style={{ fontWeight: '700', color: colors.primary }}>
              A safe start.{' '}
            </AppText>
            Keep your first chat here. Never share personal details. Report or block from the chat
            menu.
          </AppText>
        </View>
      </Card>

      <View style={{ gap: space.sm, marginTop: space.xxl }}>
        <Button label="Say hi" onPress={() => router.replace(`/chat/${match.id}`)} />
        <Button label="Keep browsing" variant="ghost" onPress={() => router.replace('/buddy')} />
      </View>

      <View style={{ height: 110 }} />
    </Screen>
  );
}
