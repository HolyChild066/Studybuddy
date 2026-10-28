import { router } from 'expo-router';
import { BadgeCheck, GraduationCap, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Card, Header, Input, Pill, Screen } from '@/components/ui';
import { useApp } from '@/lib/store';
import { UNIVERSITY } from '@/lib/subjects';
import { colors, space } from '@/theme/tokens';

export default function Verification() {
  const { currentStudent, completeVerification } = useApp();
  const [studentId, setStudentId] = useState('');
  const approved = currentStudent?.profile.verification === 'approved';

  if (approved) {
    return (
      <Screen>
        <Header title="You're verified" subtitle="Student status confirmed" />
        <View style={{ flex: 1, justifyContent: 'center', gap: space.xl }}>
          <View
            style={{
              alignSelf: 'center',
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: colors.successSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <BadgeCheck size={44} color={colors.success} />
          </View>
          <View style={{ gap: space.sm }}>
            <AppText variant="h1" align="center">
              Welcome to StudyMate
            </AppText>
            <AppText variant="body" color={colors.muted} align="center">
              {UNIVERSITY} student confirmed. Next, add the subjects you can help with and the
              ones you need a hand with.
            </AppText>
          </View>
          <Button label="Build my academic profile" onPress={() => router.replace('/edit-profile?from=setup')} />
          <Button
            label="Skip for now"
            variant="ghost"
            onPress={() => router.replace('/home')}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Header
        title="A student-only space"
        subtitle="Step 2 of 2 · Your information stays private"
        onBack={() => router.back()}
      />

      <View style={{ gap: space.lg }}>
        <Card tone="tint">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <GraduationCap size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="h3">{UNIVERSITY}</AppText>
              <AppText variant="caption" color={colors.muted}>
                Verified enrollment keeps matching inside your campus.
              </AppText>
            </View>
          </View>
        </Card>

        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <AppText variant="h3">Student ID</AppText>
            <Pill label="Not submitted" tone="warning" />
          </View>
          <Input
            label="School ID number"
            value={studentId}
            onChangeText={setStudentId}
            placeholder="e.g. 2024-00123"
            keyboardType="default"
          />
          <AppText variant="caption" color={colors.muted}>
            Only your enrollment status is shared. Your ID number is never visible to other
            students.
          </AppText>
        </Card>

        <Card tone="flat">
          <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
            <Lock size={16} color={colors.muted} style={{ marginTop: 2 }} />
            <AppText variant="caption" color={colors.muted} style={{ flex: 1 }}>
              <AppText variant="caption" style={{ fontWeight: '700' }}>
                What the badge means.{' '}
              </AppText>
              We check student status — not someone's character or safety. Report anything that
              feels wrong.
            </AppText>
          </View>
        </Card>
      </View>

      <View style={{ marginTop: space.xxl }}>
        <Button
          label="Submit for verification"
          onPress={completeVerification}
          disabled={studentId.trim().length < 4}
        />
        <AppText
          variant="caption"
          color={colors.muted}
          align="center"
          style={{ marginTop: space.md }}>
          Demo mode approves instantly. In production a moderator reviews the submission.
        </AppText>
      </View>
    </Screen>
  );
}
