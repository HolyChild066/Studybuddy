import { router, useLocalSearchParams } from 'expo-router';
import {
  Ban,
  CalendarDays,
  Check,
  Flag,
  MapPin,
  MoreVertical,
  Plus,
  ShieldCheck,
  Video,
  X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReportSheet } from '@/components/report-sheet';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { AppText, Avatar, Button, Card, Chip, Header, Pill, Screen } from '@/components/ui';
import { useApp } from '@/lib/store';
import { DAY_LABELS, formatDate, subjectLabel, to12h } from '@/lib/subjects';
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  deriveStage,
  primarySuggestions,
  renderTemplate,
  templateByKey,
  templatesByCategory,
} from '@/lib/templates';
import type {
  ChatMessage,
  MessageCategory,
  MessagePayload,
  MessageTemplate,
  PlaceholderType,
  ReportReason,
} from '@/lib/types';
import { colors, radius, space } from '@/theme/tokens';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const {
    matchFor,
    partnerOf,
    currentStudent,
    state,
    sendMessage,
    setSessionStatus,
    blockUser,
    reportUser,
    scoreFor,
  } = useApp();

  const [browserOpen, setBrowserOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [category, setCategory] = useState<MessageCategory>('introduction');
  const [picking, setPicking] = useState<{
    template: MessageTemplate;
    type: PlaceholderType;
  } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState<ChatMessage | undefined>();

  const match = id ? matchFor(id) : undefined;
  const partner = match ? partnerOf(match) : undefined;

  const messages = useMemo(
    () =>
      state.messages
        .filter((m) => m.matchId === id)
        .sort((a, b) => a.at - b.at),
    [state.messages, id],
  );

  const sessions = useMemo(
    () => state.sessions.filter((s) => s.matchId === id),
    [state.sessions, id],
  );

  if (!match || !partner || !currentStudent) {
    return (
      <Screen>
        <Header title="Chat" onBack={() => router.back()} />
        <AppText variant="body" color={colors.muted}>
          This conversation is no longer available.
        </AppText>
      </Screen>
    );
  }

  const stage = deriveStage(messages, sessions);
  const suggestions = primarySuggestions(stage, 5);
  const score = scoreFor(partner.profile.id);
  const defaultSubjectId =
    score?.sharedSubjectIds[0] ??
    currentStudent.subjects[0]?.subjectId ??
    '';
  const defaultSubjectName = defaultSubjectId ? subjectLabel(defaultSubjectId) : 'a subject';
  const firstSlot = currentStudent.availability[0];
  const defaultSlot = firstSlot
    ? `${DAY_LABELS[firstSlot.day]} ${to12h(firstSlot.start)}–${to12h(firstSlot.end)}`
    : 'a time that works';

  const send = (template: MessageTemplate, payload: MessagePayload = {}) => {
    sendMessage(match.id, template.key, payload);
  };

  const beginTemplate = (template: MessageTemplate) => {    setBrowserOpen(false);

    if (template.key === 'schedule_session') {
      router.push(`/session/new?matchId=${match.id}`);
      return;
    }
    if (template.placeholders.includes('subject')) {
      setPicking({ template, type: 'subject' });
      return;
    }
    if (template.placeholders.includes('slot')) {
      setPicking({ template, type: 'slot' });
      return;
    }
    if (template.placeholders.includes('session')) {
      router.push(`/session/new?matchId=${match.id}`);
      return;
    }
    send(template);
  };

  const acceptSession = (sessionId: string) => {
    setSessionStatus(sessionId, 'confirmed');
    const t = templateByKey('sounds_good');
    if (t) send(t);
  };

  const sendPicked = (payload: MessagePayload) => {
    if (!picking) return;
    send(picking.template, payload);
    setPicking(null);
  };

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: space.lg }}>
        <Header
          title={partner.profile.name}
          subtitle={`Verified student · ${partner.profile.course.replace('BS ', '')}`}
          onBack={() => router.back()}
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Chat options"
              onPress={() => setMenuOpen(true)}
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
              <MoreVertical size={18} color={colors.muted} />
            </Pressable>
          }
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: space.xl,
          gap: space.md,
        }}
        showsVerticalScrollIndicator={false}>
        <Card tone="tint">
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <ShieldCheck size={16} color={colors.primary} style={{ marginTop: 1 }} />
            <AppText variant="caption" color={colors.primary} style={{ flex: 1 }}>
              <AppText variant="caption" style={{ fontWeight: '700', color: colors.primary }}>
                Guided chat only.{' '}
              </AppText>
              Pick from academic prompts. Never share personal details. Report or block from the
              menu.
            </AppText>
          </View>
        </Card>

        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Pill
            label={
              stage === 'scheduled'
                ? 'Session stage'
                : stage === 'subject'
                  ? 'Subject picked'
                  : 'New match'
            }
            tone="primary"
          />
        </View>

        {messages.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: space.xxl, gap: 6 }}>
            <AppText variant="h3">Start with a hello</AppText>
            <AppText variant="caption" color={colors.muted} align="center">
              Tap a suggested prompt below to break the ice.
            </AppText>
          </View>
        ) : null}

        {messages.map((message) => {
          const mine = message.senderId === currentStudent.profile.id;
          const template = templateByKey(message.templateKey);
          const text = template
            ? renderTemplate(template.text, {
                subjectName: message.payload.subjectId
                  ? subjectLabel(message.payload.subjectId)
                  : undefined,
                slotLabel: message.payload.slot
                  ? formatSlot(message.payload.slot)
                  : undefined,
              })
            : 'Message';
          const session = message.payload.sessionId
            ? state.sessions.find((s) => s.id === message.payload.sessionId)
            : undefined;

          return (
            <View
              key={message.id}
              style={{
                flexDirection: 'row',
                justifyContent: mine ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                gap: space.sm,
              }}>
              {!mine ? (
                <Avatar
                  name={partner.profile.name}
                  color={partner.profile.avatarColor}
                  size={30}
                />
              ) : null}

              <Pressable
                onLongPress={() => {
                  setReportMessage(message);
                  setReportOpen(true);
                }}
                style={{ maxWidth: '78%', gap: 4 }}>
                <View
                  style={{
                    backgroundColor: mine ? colors.primary : colors.surface,
                    borderWidth: mine ? 0 : 1,
                    borderColor: colors.border,
                    borderRadius: radius.xl,
                    borderBottomRightRadius: mine ? 6 : radius.xl,
                    borderBottomLeftRadius: mine ? radius.xl : 6,
                    paddingVertical: 10,
                    paddingHorizontal: space.md,
                    gap: 4,
                  }}>
                  <AppText
                    variant="small"
                    color={mine ? colors.white : colors.text}
                    style={{ lineHeight: 21 }}>
                    {template?.emoji ? `${template.emoji} ` : ''}
                    {text}
                  </AppText>
                </View>
                <AppText
                  variant="caption"
                  color={colors.muted}
                  align={mine ? 'right' : 'left'}>
                  {new Date(message.at).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </AppText>

                {session ? (
                  <SessionCard
                    session={session}
                    canAccept={!mine && session.status === 'proposed'}
                    onAccept={() => acceptSession(session.id)}
                    onOpen={() => router.push(`/session/${session.id}`)}
                  />
                ) : null}
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.bg,
          paddingTop: space.md,
          paddingBottom: Math.max(insets.bottom, space.md),
          paddingHorizontal: space.lg,
          gap: space.sm,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText variant="label" color={colors.muted}>
            SUGGESTED FOR THIS STAGE
          </AppText>
          <Pressable
            onPress={() => setBrowserOpen(true)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Plus size={14} color={colors.primary} />
            <AppText variant="caption" color={colors.primary}>
              All messages
            </AppText>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: space.sm, paddingRight: space.lg }}>
            {suggestions.map((t) => (
              <Chip
                key={t.key}
                emoji={t.emoji}
                label={renderTemplate(t.text, {
                  subjectName: defaultSubjectName,
                  slotLabel: defaultSlot,
                })}
                onPress={() => beginTemplate(t)}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Full template browser */}
      <Modal visible={browserOpen} animationType="slide" transparent onRequestClose={() => setBrowserOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: colors.bg,
              borderTopLeftRadius: radius.xxl,
              borderTopRightRadius: radius.xxl,
              padding: space.xl,
              paddingBottom: Math.max(insets.bottom, space.xl),
              gap: space.md,
              maxHeight: '86%',
            }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText variant="h2">Guided messages</AppText>
              <Pressable onPress={() => setBrowserOpen(false)} hitSlop={10}>
                <X size={22} color={colors.muted} />
              </Pressable>
            </View>

            <AppText variant="caption" color={colors.muted}>
              No keyboard, no free text. Choose a prompt — the backend only accepts known
              templates.
            </AppText>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: space.sm, paddingRight: space.lg }}>
                {CATEGORY_ORDER.map((cat) => (
                  <Chip
                    key={cat}
                    emoji={CATEGORY_META[cat].emoji}
                    label={CATEGORY_META[cat].label}
                    active={category === cat}
                    onPress={() => setCategory(cat)}
                  />
                ))}
              </View>
            </ScrollView>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: space.sm }}>
                {templatesByCategory(category).map((t) => (
                  <Pressable key={t.key} onPress={() => beginTemplate(t)}>
                    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md }}>
                      <AppText style={{ fontSize: 20 }}>{t.emoji}</AppText>
                      <AppText variant="small" style={{ flex: 1 }}>
                        {renderTemplate(t.text, {
                          subjectName: defaultSubjectName,
                          slotLabel: defaultSlot,
                        })}
                      </AppText>
                      {t.placeholders.length ? <Pill label="Choose" /> : null}
                    </Card>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Placeholder picker */}
      <Modal visible={Boolean(picking)} animationType="slide" transparent onRequestClose={() => setPicking(null)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: colors.bg,
              borderTopLeftRadius: radius.xxl,
              borderTopRightRadius: radius.xxl,
              padding: space.xl,
              paddingBottom: Math.max(insets.bottom, space.xl),
              gap: space.md,
            }}>
            <AppText variant="h2">
              {picking?.type === 'subject' ? 'Which subject?' : 'Which time?'}
            </AppText>
            <AppText variant="caption" color={colors.muted}>
              {picking?.template.emoji} {picking?.template.text}
            </AppText>

            <ScrollView style={{ maxHeight: 320 }}>
              <View style={{ gap: space.sm }}>
                {picking?.type === 'subject'
                  ? currentStudent.subjects.map((entry) => (
                      <Pressable
                        key={`${entry.subjectId}-${entry.kind}`}
                        onPress={() => sendPicked({ subjectId: entry.subjectId })}>
                        <Card style={{ padding: space.md, flexDirection: 'row', justifyContent: 'space-between' }}>
                          <AppText variant="small">{subjectLabel(entry.subjectId)}</AppText>
                          <Pill label={entry.kind.replace('_', ' ')} />
                        </Card>
                      </Pressable>
                    ))
                  : currentStudent.availability.map((slot) => {
                      const value = `${slot.day}|${slot.start}|${slot.end}`;
                      return (
                        <Pressable
                          key={value}
                          onPress={() => sendPicked({ slot: value })}>
                          <Card style={{ padding: space.md }}>
                            <AppText variant="small">
                              {DAY_LABELS[slot.day]} {to12h(slot.start)}–{to12h(slot.end)}
                            </AppText>
                          </Card>
                        </Pressable>
                      );
                    })}
              </View>
            </ScrollView>

            <Button label="Cancel" variant="ghost" onPress={() => setPicking(null)} />
          </View>
        </View>
      </Modal>

      {/* Conversation menu */}
      <Modal visible={menuOpen} animationType="fade" transparent onRequestClose={() => setMenuOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: colors.overlay }}
          onPress={() => setMenuOpen(false)}>
          <View
            style={{
              position: 'absolute',
              right: space.lg,
              top: 100,
              backgroundColor: colors.surface,
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: colors.border,
              padding: space.sm,
              minWidth: 200,
            }}>
            <MenuItem
              icon={<CalendarDays size={16} color={colors.text} />}
              label="Schedule a session"
              onPress={() => {
                setMenuOpen(false);
                router.push(`/session/new?matchId=${match.id}`);
              }}
            />
            <MenuItem
              icon={<Flag size={16} color={colors.text} />}
              label="Report user"
              onPress={() => {
                setMenuOpen(false);
                setReportMessage(undefined);
                setReportOpen(true);
              }}
            />
            <MenuItem
              icon={<Ban size={16} color={colors.danger} />}
              label="Block user"
              danger
              onPress={() => {
                setMenuOpen(false);
                setBlockOpen(true);
              }}
            />
          </View>
        </Pressable>
      </Modal>

      <ConfirmDialog
        visible={blockOpen}
        title={`Block ${partner.profile.name}?`}
        message="They will not be able to message you, match with you, or book sessions with you. Blocking is enforced on the server, not just hidden in the app."
        confirmLabel="Block user"
        danger
        onCancel={() => setBlockOpen(false)}
        onConfirm={() => {
          blockUser(partner.profile.id);
          setBlockOpen(false);
          router.replace('/chats');
        }}
      />

      <ReportSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        context={
          reportMessage && templateByKey(reportMessage.templateKey)
            ? `${templateByKey(reportMessage.templateKey)!.emoji} ${renderTemplate(
                templateByKey(reportMessage.templateKey)!.text,
              )}`
            : undefined
        }
        onSubmit={(reason: ReportReason, note?: string) =>
          reportUser({
            reportedId: partner.profile.id,
            reason,
            note,
            messageId: reportMessage?.id,
            messageText:
              reportMessage && templateByKey(reportMessage.templateKey)
                ? renderTemplate(templateByKey(reportMessage.templateKey)!.text)
                : undefined,
            messageCategory: reportMessage
              ? templateByKey(reportMessage.templateKey)?.category
              : undefined,
          })
        }
      />
    </Screen>
  );
}

function formatSlot(slot: string): string {
  const [dayRaw, start, end] = slot.split('|');
  const day = Number(dayRaw);
  return `${DAY_LABELS[day] ?? ''} ${to12h(start ?? '00:00')}–${to12h(end ?? '00:00')}`;
}

function MenuItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md }}>
      {icon}
      <AppText variant="small" color={danger ? colors.danger : colors.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

function SessionCard({
  session,
  canAccept,
  onAccept,
  onOpen,
}: {
  session: {
    id: string;
    date: string;
    start: string;
    end: string;
    mode: 'online' | 'in_person';
    location: string;
    status: string;
    subjectId: string;
  };
  canAccept: boolean;
  onAccept: () => void;
  onOpen: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.surfaceAlt,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.primarySoft,
        padding: space.md,
        gap: space.sm,
        marginTop: space.xs,
      }}>
      <AppText variant="label" color={colors.primary}>
        STUDY SESSION · {session.status.toUpperCase()}
      </AppText>
      <AppText variant="h3">{subjectLabel(session.subjectId)}</AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <CalendarDays size={14} color={colors.muted} />
        <AppText variant="caption" color={colors.muted}>
          {formatDate(session.date)} · {to12h(session.start)}–{to12h(session.end)}
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {session.mode === 'online' ? (
          <Video size={14} color={colors.muted} />
        ) : (
          <MapPin size={14} color={colors.muted} />
        )}
        <AppText variant="caption" color={colors.muted}>
          {session.location}
        </AppText>
      </View>

      {canAccept ? (
        <Button
          label="Accept session"
          icon={<Check size={16} color={colors.text} />}
          onPress={onAccept}
        />
      ) : (
        <Pressable onPress={onOpen}>
          <AppText variant="caption" color={colors.primary}>
            View session details
          </AppText>
        </Pressable>
      )}
    </View>
  );
}
