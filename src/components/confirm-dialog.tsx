import { Modal, Pressable, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { colors, radius, space } from '@/theme/tokens';

/**
 * Cross-platform confirmation dialog. React Native's Alert is a no-op on web,
 * so destructive actions use this instead.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'center',
          padding: space.xl,
        }}>
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.xxl,
            padding: space.xl,
            gap: space.md,
          }}>
          <AppText variant="h2">{title}</AppText>
          <AppText variant="small" color={colors.muted}>
            {message}
          </AppText>
          <View style={{ gap: space.sm, marginTop: space.sm }}>
            <Button label={confirmLabel} variant={danger ? 'danger' : 'primary'} onPress={onConfirm} />
            <Button label={cancelLabel} variant="ghost" onPress={onCancel} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
