import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppText, Button, Screen } from '@/components/ui';
import { colors, radius, space } from '@/theme/tokens';

const SLIDES = [
  {
    emoji: '👋',
    title: 'Match with study buddies',
    body: 'Find people who share your goals. Swap what you know for what you need.',
    tint: '#E6E9FD',
  },
  {
    emoji: '🤝',
    title: 'Skill exchange, not tutoring',
    body: 'You explain Programming 1. They explain Database Systems. Everyone leaves sharper.',
    tint: '#FFE9E7',
  },
  {
    emoji: '💬',
    title: 'Guided, safer chat',
    body: 'No free-text messages — just clear academic prompts. In-person sessions happen at the University Library.',
    tint: '#E7F8F0',
  },
];

export default function Welcome() {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index]!;
  const last = index === SLIDES.length - 1;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: space.sm }}>
        <Pressable onPress={() => router.push('/sign-in')} hitSlop={10}>
          <AppText variant="small" color={colors.muted}>
            Skip
          </AppText>
        </Pressable>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', gap: space.xxl }}>
        <View
          style={{
            height: 280,
            borderRadius: 32,
            backgroundColor: slide.tint,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
          }}>
          <Text style={{ fontSize: 92 }}>{slide.emoji}</Text>
        </View>

        <View style={{ gap: space.md }}>
          <AppText variant="display">{slide.title}</AppText>
          <AppText variant="body" color={colors.muted}>
            {slide.body}
          </AppText>
        </View>

        <View style={{ flexDirection: 'row', gap: 6 }}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                height: 6,
                width: i === index ? 24 : 6,
                borderRadius: radius.pill,
                backgroundColor: i === index ? colors.primary : colors.border,
              }}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: space.md, paddingBottom: space.xl }}>
        <Button
          label={last ? 'Get started' : 'Continue'}
          onPress={() => (last ? router.push('/sign-up') : setIndex((i) => i + 1))}
        />
        <Pressable onPress={() => router.push('/sign-in')} style={{ alignItems: 'center' }}>
          <AppText variant="small" color={colors.primary}>
            I already have an account
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}
