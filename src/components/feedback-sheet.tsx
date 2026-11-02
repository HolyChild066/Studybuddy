import { useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';

import { AppText, Button, Chip } from '@/components/ui';
import type { FeedbackConcern, FeedbackTag, Rating } from '@/lib/types';
import { colors, radius, space } from '@/theme/tokens';

const RATINGS: { value: Rating; label: string; emoji: string }[] = [
  { value: 5, label: 'Very helpful', emoji: '🌟' },
  { value: 4, label: 'Helpful', emoji: '👍' },
  { value: 3, label: 'Somewhat', emoji: '😐' },
  { value: 2, label: 'Not really', emoji: '📉' },
];

const TAGS: { key: FeedbackTag; label: string }[] = [
  { key: 'focused', label: 'Focused' },
  { key: 'on_time', label: 'On time' },
  { key: 'helpful', label: 'Helpful' },
  { key: 'great_explainer', label: 'Great explainer' },
];

const CONCERNS: { key: FeedbackConcern; label: string }[] = [
  { key: 'safety_concern', label: 'Safety concern' },
  { key: 'off_topic', label: 'Off-topic' },
  { key: 'unhelpful', label: 'Unhelpful' },
  { key: 'other', label: 'Other' },
];

export function FeedbackSheet({
  visible,
  partnerName,
  subjectName,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  partnerName: string;
  subjectName: string;
  onClose: () => void;
  onSubmit: (data: {
    rating: Rating;
    tags: FeedbackTag[];
    note?: string;
    concern?: FeedbackConcern;
  }) => void;
}) {
  const [rating, setRating] = useState<Rating>(5);
  const [selectedTags, setSelectedTags] = useState<FeedbackTag[]>([]);
  const [note, setNote] = useState('');
  const [hasConcern, setHasConcern] = useState(false);
  const [concern, setConcern] = useState<FeedbackConcern | undefined>();

  const toggleTag = (tag: FeedbackTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: radius.xxl,
            borderTopRightRadius: radius.xxl,
            padding: space.xl,
            gap: space.lg,
            maxHeight: '90%',
          }}>
          <View style={{ gap: 4 }}>
            <AppText variant="label" color={colors.primary}>
              SESSION COMPLETED · {subjectName}
            </AppText>
            <AppText variant="h2">How was your session with {partnerName}?</AppText>
            <AppText variant="caption" color={colors.muted}>
              A little feedback helps us make better study matches.
            </AppText>
          </View>

          {/* Rating */}
          <View style={{ gap: space.sm }}>
            <AppText variant="small" style={{ fontWeight: '600' }}>
              Rate your study time
            </AppText>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              {RATINGS.map((r) => (
                <Pressable
                  key={r.value}
                  onPress={() => setRating(r.value)}
                  style={{
                    flex: 1,
                    backgroundColor: rating === r.value ? colors.primarySoft : colors.surface,
                    borderColor: rating === r.value ? colors.primary : colors.border,
                    borderWidth: 1,
                    borderRadius: radius.md,
                    padding: space.sm,
                    alignItems: 'center',
                    gap: 4,
                  }}>
                  <AppText style={{ fontSize: 20 }}>{r.emoji}</AppText>
                  <AppText variant="caption" style={{ fontWeight: rating === r.value ? '700' : '400' }}>
                    {r.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Tags */}
          <View style={{ gap: space.sm }}>
            <AppText variant="small" style={{ fontWeight: '600' }}>
              What stood out?
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {TAGS.map((t) => {
                const active = selectedTags.includes(t.key);
                return (
                  <Chip
                    key={t.key}
                    label={t.label}
                    active={active}
                    onPress={() => toggleTag(t.key)}
                  />
                );
              })}
            </View>
          </View>

          {/* Private note */}
          <View style={{ gap: space.sm }}>
            <AppText variant="small" style={{ fontWeight: '600' }}>
              Optional private note
            </AppText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Anything you'd like our team to know?"
              placeholderTextColor={colors.muted}
              multiline
              style={{
                minHeight: 70,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                padding: space.md,
                fontFamily: 'Inter_400Regular',
                fontSize: 15,
                color: colors.text,
                textAlignVertical: 'top',
              }}
            />
            <AppText variant="caption" color={colors.muted}>
              Only our team can see your note. It is not shared with {partnerName}.
            </AppText>
          </View>

          {/* Concern toggle */}
          <View style={{ gap: space.sm }}>
            <Pressable
              onPress={() => {
                setHasConcern(!hasConcern);
                if (hasConcern) setConcern(undefined);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: hasConcern ? colors.danger : colors.border,
                  backgroundColor: hasConcern ? colors.dangerSoft : colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {hasConcern ? <AppText color={colors.danger} style={{ fontSize: 12 }}>✓</AppText> : null}
              </View>
              <AppText variant="small" color={hasConcern ? colors.danger : colors.text}>
                I had a concern regarding this session
              </AppText>
            </Pressable>

            {hasConcern ? (
              <View style={{ gap: space.sm, marginTop: 4 }}>
                <AppText variant="caption" color={colors.muted}>
                  Select concern category:
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                  {CONCERNS.map((c) => (
                    <Chip
                      key={c.key}
                      label={c.label}
                      active={concern === c.key}
                      onPress={() => setConcern(c.key)}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          <Button
            label="Submit feedback"
            onPress={() => {
              onSubmit({
                rating,
                tags: selectedTags,
                note: note.trim() || undefined,
                concern,
              });
              onClose();
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
