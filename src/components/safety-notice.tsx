import { MapPin, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { colors, radius, space } from '@/theme/tokens';

export function SafetyNotice({
  visible,
  onCancel,
  onAcknowledge,
}: {
  visible: boolean;
  onCancel: () => void;
  onAcknowledge: () => void;
}) {
  const [checked, setChecked] = useState(false);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'center',
          padding: space.xl,
        }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.xxl,
            padding: space.xl,
            gap: space.lg,
          }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <ShieldCheck size={28} color={colors.primary} />
          </View>

          <AppText variant="h2">In-person study safety</AppText>
          <AppText variant="small" color={colors.muted}>
            For your safety, StudyMate only supports in-person study sessions at the University
            Library. Do not share your home address or private location with other users.
          </AppText>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.sm,
              backgroundColor: colors.surfaceAlt,
              padding: space.md,
              borderRadius: radius.md,
            }}>
            <MapPin size={16} color={colors.primary} />
            <AppText variant="caption" color={colors.primary}>
              Location is fixed: University Library
            </AppText>
          </View>

          <Button
            label={checked ? 'I understand — continue' : 'I understand'}
            onPress={() => {
              if (!checked) {
                setChecked(true);
                return;
              }
              onAcknowledge();
              setChecked(false);
            }}
          />
          <Button label="Cancel" variant="ghost" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
}
