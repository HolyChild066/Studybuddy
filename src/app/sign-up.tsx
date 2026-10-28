import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { AppText, Button, Chip, Input, Screen } from '@/components/ui';
import { useApp } from '@/lib/store';
import { COURSES, YEARS } from '@/lib/subjects';
import { colors, space } from '@/theme/tokens';

export default function SignUp() {
  const { signUp } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [course, setCourse] = useState(COURSES[0]!);
  const [year, setYear] = useState(2);

  const canSubmit = name.trim().length > 1 && email.includes('@') && password.length >= 8;

  const submit = () => {
    signUp({ name, email, course, year });
    router.replace('/verification');
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, gap: space.xl, paddingTop: space.xxl }}>
        <View style={{ gap: 6 }}>
          <AppText variant="display">Create your account</AppText>
          <AppText variant="body" color={colors.muted}>
            One account for your subjects, buddies, and study sessions.
          </AppText>
        </View>

        <View style={{ gap: space.lg }}>
          <Input label="Full name" value={name} onChangeText={setName} placeholder="KJ Rivera" />
          <Input
            label="University email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="kj@northbridge.edu"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="At least 8 characters"
            hint="Your name is visible to buddies. Your email stays private."
          />
        </View>

        <View style={{ gap: space.sm }}>
          <AppText variant="label" color={colors.muted}>
            COURSE
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {COURSES.map((c) => (
              <Chip key={c} label={c} active={course === c} onPress={() => setCourse(c)} />
            ))}
          </View>
        </View>

        <View style={{ gap: space.sm }}>
          <AppText variant="label" color={colors.muted}>
            YEAR LEVEL
          </AppText>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            {YEARS.map((y) => (
              <Chip
                key={y}
                label={`Year ${y}`}
                active={year === y}
                onPress={() => setYear(y)}
              />
            ))}
          </View>
        </View>

        <Button label="Continue" onPress={submit} disabled={!canSubmit} />
      </KeyboardAvoidingView>
    </Screen>
  );
}
