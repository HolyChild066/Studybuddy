import { Home, MessageCircle, User, Users } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, radius, shadow, space } from '@/theme/tokens';

const TABS = [
  { name: 'home', label: 'Home', Icon: Home },
  { name: 'buddy', label: 'Buddy', Icon: Users },
  { name: 'chats', label: 'Chat', Icon: MessageCircle },
  { name: 'profile', label: 'Profile', Icon: User },
] as const;

export interface TabBarProps {
  state: {
    index: number;
    routes: { key: string; name: string }[];
  };
  navigateToTab: (routeKey: string) => void;
}

export function TabBar({ state, navigateToTab }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingHorizontal: space.lg,
        paddingBottom: Math.max(insets.bottom, space.md),
        paddingTop: space.sm,
        backgroundColor: 'transparent',
      }}
      pointerEvents="box-none">
      <View
        style={[
          {
            height: 68,
            borderRadius: radius.xxl,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            padding: 8,
            gap: 4,
          },
          shadow.floating,
        ]}>
        {TABS.map((tab) => {
          const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
          const focused = state.index === routeIndex;
          const Icon = tab.Icon;

          return (
            <Pressable
              key={tab.name}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={() => {
                const route = state.routes[routeIndex];
                if (!focused && route) navigateToTab(route.key);
              }}
              style={{
                flex: 1,
                height: 52,
                borderRadius: radius.xxl,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                backgroundColor: focused ? colors.primarySoft : 'transparent',
              }}>
              <Icon
                size={20}
                color={focused ? colors.primary : colors.muted}
                strokeWidth={focused ? 2.4 : 2}
              />
              <Text
                style={{
                  fontFamily: focused ? font.semibold : font.medium,
                  fontSize: 11,
                  color: focused ? colors.primary : colors.muted,
                }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
