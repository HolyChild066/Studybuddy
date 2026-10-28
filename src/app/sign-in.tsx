import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

import { AppText, Button, Card, Input, Screen } from '@/components/ui';
import { useApp } from '@/lib/store';
import { colors, space } from '@/theme/tokens';

export default function SignIn() {
  const { signIn } = useApp();
  const [email, setEmail] = useState('alex@northbridge.edu');
  const [password, setPassword] = useState('demo1234');

  const submit = () => {
    signIn(email);
    router.replace('/home');
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, gap: space.xl, paddingTop: space.xxl }}>
        <View style={{ gap: 6 }}>
          <AppText variant="display">Welcome back</AppText>
          <AppText variant="body" color={colors.muted}>
            Pick up where your study group left off.
          </AppText>
        </View>

        <Card tone="tint">
          <AppText variant="h3">Demo account</AppText>
          <AppText variant="small" color={colors.muted}>
            Use <AppText variant="small" color={colors.primary}>alex@northbridge.edu</AppText> and
            any password. Jamie and Maria are already verified and waiting in your deck.
          </AppText>
        </Card>

        <View style={{ gap: space.lg }}>
          <Input
            label="Email address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@northbridge.edu"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />
        </View>

        <Button label="Log in" onPress={submit} />

        <View style={{ alignItems: 'center' }}>
          <Pressable onPress={() => router.push('/sign-up')}>
            <AppText variant="small" color={colors.primary}>
              New here? Create an account
            </AppText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
