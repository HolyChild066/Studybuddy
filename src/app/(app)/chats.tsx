import { router } from 'expo-router';
import { ChevronRight, MessageCircle } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { AppText, Avatar, Card, EmptyState, Pill, Screen } from '@/components/ui';
import { useApp } from '@/lib/store';
import { subjectLabel } from '@/lib/subjects';
import { deriveStage, renderTemplate, templateByKey } from '@/lib/templates';
import { colors, space } from '@/theme/tokens';
import type { ChatMessage } from '@/lib/types';

function preview(message: ChatMessage | undefined): string {
  if (!message) return 'Say hi with a guided message';
  const template = templateByKey(message.templateKey);
  if (!template) return 'New message';
  return `${template.emoji} ${renderTemplate(template.text, {
    subjectName: message.payload.subjectId ? subjectLabel(message.payload.subjectId) : undefined,
  })}`;
}

function timeLabel(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function ChatsScreen() {
  const { myMatches, partnerOf, state } = useApp();

  return (
    <Screen scroll>
      <View style={{ paddingTop: space.lg, gap: 6 }}>
        <AppText variant="h1">Chats</AppText>
        <AppText variant="small" color={colors.muted}>
          Guided conversations with your study matches.
        </AppText>
      </View>

      {myMatches.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            emoji="💬"
            title="No conversations yet"
            body="Match with a study buddy to open a guided chat."
            action={
              <Pressable
                onPress={() => router.push('/buddy')}
                style={{
                  height: 50,
                  borderRadius: 999,
                  backgroundColor: colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <AppText variant="h3">Find a buddy</AppText>
              </Pressable>
            }
          />
        </View>
      ) : (
        <View style={{ marginTop: space.lg, gap: space.sm }}>
          {myMatches.map((match) => {
            const partner = partnerOf(match);
            if (!partner) return null;
            const messages = state.messages
              .filter((m) => m.matchId === match.id)
              .sort((a, b) => a.at - b.at);
            const last = messages[messages.length - 1];
            const sessions = state.sessions.filter((s) => s.matchId === match.id);
            const stage = deriveStage(messages, sessions);

            return (
              <Pressable key={match.id} onPress={() => router.push(`/chat/${match.id}`)}>
                <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <Avatar name={partner.profile.name} color={partner.profile.avatarColor} size={48} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <AppText variant="h3">{partner.profile.name}</AppText>
                      <AppText variant="caption" color={colors.muted}>
                        {last ? timeLabel(last.at) : ''}
                      </AppText>
                    </View>
                    <AppText variant="caption" color={colors.muted} numberOfLines={1}>
                      {preview(last)}
                    </AppText>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                      <Pill
                        label={
                          stage === 'scheduled'
                            ? 'Session set'
                            : stage === 'subject'
                              ? 'Subject picked'
                              : 'New match'
                        }
                        tone={stage === 'scheduled' ? 'success' : 'primary'}
                      />
                    </View>
                  </View>
                  <ChevronRight size={18} color={colors.border} />
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}

      <Card tone="tint" style={{ marginTop: space.lg }}>
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
          <MessageCircle size={16} color={colors.primary} />
          <AppText variant="caption" color={colors.primary} style={{ flex: 1 }}>
            There is no free-text chat in StudyMate. You choose from academic prompts, so
            conversations stay clear and safe.
          </AppText>
        </View>
      </Card>

      <View style={{ height: 110 }} />
    </Screen>
  );
}
