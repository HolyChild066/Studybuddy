import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';

import { AppText, Button, Chip } from '@/components/ui';
import type { ReportReason } from '@/lib/types';
import { colors, radius, space } from '@/theme/tokens';

const REASONS: { key: ReportReason; label: string }[] = [
  { key: 'harassment', label: 'Harassment' },
  { key: 'spam', label: 'Spam' },
  { key: 'inappropriate', label: 'Inappropriate behavior' },
  { key: 'fake_identity', label: 'Fake identity' },
  { key: 'academic_misconduct', label: 'Academic misconduct' },
  { key: 'other', label: 'Other' },
];

export function ReportSheet({
  visible,
  onClose,
  onSubmit,
  context,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason, note?: string) => void;
  context?: string;
}) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');

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
            maxHeight: '88%',
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText variant="h2">Report user</AppText>
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={22} color={colors.muted} />
            </Pressable>
          </View>

          {context ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: space.md,
              }}>
              <AppText variant="label" color={colors.muted}>
                REPORTED MESSAGE
              </AppText>
              <AppText variant="small">{context}</AppText>
            </View>
          ) : null}

          <AppText variant="small" color={colors.muted}>
            Why are you reporting this user?
          </AppText>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {REASONS.map((r) => (
              <Chip
                key={r.key}
                label={r.label}
                active={reason === r.key}
                onPress={() => setReason(r.key)}
              />
            ))}
          </View>

          {reason === 'other' ? (
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a short note (only moderators see this)"
              placeholderTextColor={colors.muted}
              multiline
              style={{
                minHeight: 84,
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
          ) : null}

          <AppText variant="caption" color={colors.muted}>
            Reports are private. Only the StudyMate moderation team can review them.
          </AppText>

          <Button
            label="Submit report"
            variant="danger"
            disabled={!reason}
            onPress={() => {
              if (!reason) return;
              onSubmit(reason, note.trim() || undefined);
              setReason(null);
              setNote('');
              onClose();
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
