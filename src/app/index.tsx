import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useApp } from '@/lib/store';
import { colors } from '@/theme/tokens';

export default function Index() {
  const { state, currentStudent } = useApp();

  if (!state.hydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg,
        }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!state.signedIn || !currentStudent) {
    return <Redirect href="/welcome" />;
  }

  if (currentStudent.profile.verification !== 'approved') {
    return <Redirect href="/verification" />;
  }

  return <Redirect href="/home" />;
}
