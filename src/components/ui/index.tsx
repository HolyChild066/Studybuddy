import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, font, layout, radius, shadow, space } from '@/theme/tokens';

type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'small'
  | 'caption'
  | 'label';

const textStyles: Record<TextVariant, TextStyle> = {
  display: { fontFamily: font.bold, fontSize: 34, lineHeight: 40, letterSpacing: -0.6 },
  h1: { fontFamily: font.bold, fontSize: 26, lineHeight: 32, letterSpacing: -0.3 },
  h2: { fontFamily: font.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  h3: { fontFamily: font.semibold, fontSize: 17, lineHeight: 23 },
  body: { fontFamily: font.regular, fontSize: 17, lineHeight: 24 },
  small: { fontFamily: font.regular, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: font.regular, fontSize: 12, lineHeight: 17 },
  label: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.3 },
};

export function AppText({
  variant = 'body',
  color = colors.text,
  align,
  style,
  children,
  numberOfLines,
}: {
  variant?: TextVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
  numberOfLines?: number;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[textStyles[variant], { color, textAlign: align }, style]}>
      {children}
    </Text>
  );
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const inner = (
    <View
      style={[
        styles.screenInner,
        padded && { paddingHorizontal: layout.screenPadding },
        contentStyle,
      ]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.screen, style]} edges={['top']}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
  tone = 'surface',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'surface' | 'tint' | 'flat';
}) {
  return (
    <View
      style={[
        styles.card,
        tone === 'tint' && { backgroundColor: colors.surfaceAlt, borderColor: colors.primarySoft },
        tone === 'flat' && { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}>
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const isDisabled = disabled || loading;
  const bg =
    variant === 'primary'
      ? colors.accent
      : variant === 'danger'
        ? colors.dangerSoft
        : variant === 'secondary'
          ? colors.surface
          : 'transparent';
  const fg =
    variant === 'primary'
      ? colors.text
      : variant === 'danger'
        ? colors.danger
        : colors.primary;
  const border = variant === 'secondary' ? colors.border : 'transparent';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.buttonInner}>
          {icon}
          <Text style={[styles.buttonLabel, { color: fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  emoji,
  active,
  onPress,
  tone = 'default',
  style,
}: {
  label: string;
  emoji?: string;
  active?: boolean;
  onPress?: () => void;
  tone?: 'default' | 'primary' | 'success' | 'danger';
  style?: StyleProp<ViewStyle>;
}) {
  const toneStyles: Record<string, { bg: string; border: string; fg: string }> = {
    default: { bg: colors.surface, border: colors.border, fg: colors.text },
    primary: { bg: colors.primarySoft, border: colors.primary, fg: colors.primary },
    success: { bg: colors.successSoft, border: colors.success, fg: colors.success },
    danger: { bg: colors.dangerSoft, border: colors.danger, fg: colors.danger },
  };
  const t = toneStyles[active ? 'primary' : tone] ?? toneStyles.default;

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: t.bg,
          borderColor: t.border,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}>
      {emoji ? <Text style={styles.chipEmoji}>{emoji}</Text> : null}
      <Text style={[styles.chipLabel, { color: t.fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Avatar({
  name,
  color = colors.primary,
  size = 44,
  ring,
}: {
  name: string;
  color?: string;
  size?: number;
  ring?: boolean;
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          borderWidth: ring ? 3 : 0,
          borderColor: colors.surface,
        },
      ]}>
      <Text style={{ fontFamily: font.bold, fontSize: size * 0.36, color: colors.white }}>
        {initials || '?'}
      </Text>
    </View>
  );
}

export function Header({
  title,
  subtitle,
  onBack,
  right,
  large,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  large?: boolean;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            style={styles.iconButton}
            hitSlop={8}>
            <ChevronLeft size={22} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.iconSpacer} />
        )}
        <View style={styles.headerCenter}>
          <AppText variant={large ? 'h1' : 'h3'} align="center" numberOfLines={2}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color={colors.muted} align="center" style={{ marginTop: 2 }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <View style={styles.headerRight}>{right}</View>
      </View>
    </View>
  );
}

export function Input({
  label,
  hint,
  style,
  ...props
}: TextInputProps & {
  label?: string;
  hint?: string;
  style?: StyleProp<TextStyle>;
}) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <AppText variant="label" color={colors.muted}>
          {label.toUpperCase()}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={colors.muted}
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[
          styles.input,
          focused && { borderColor: colors.primary, backgroundColor: colors.surface },
          style,
        ]}
      />
      {hint ? (
        <AppText variant="caption" color={colors.muted}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="h3">{title}</AppText>
      {action}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

export function Pill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'primary';
}) {
  const map = {
    neutral: { bg: colors.surfaceAlt, fg: colors.muted },
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: '#FFF6DA', fg: '#8A6A00' },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    primary: { bg: colors.primarySoft, fg: colors.primary },
  } as const;
  const t = map[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <Text style={[styles.pillText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  emoji,
  title,
  body,
  action,
}: {
  emoji: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 40 }}>{emoji}</Text>
      <AppText variant="h3" align="center" style={{ marginTop: space.md }}>
        {title}
      </AppText>
      {body ? (
        <AppText variant="small" color={colors.muted} align="center" style={{ marginTop: 6 }}>
          {body}
        </AppText>
      ) : null}
      {action ? <View style={{ marginTop: space.lg, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}

export const ui = StyleSheet.create({
  surface: { backgroundColor: colors.surface },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenInner: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  scrollContent: { flexGrow: 1, paddingBottom: space.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  button: {
    height: 50,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: space.lg,
  },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  buttonLabel: { fontFamily: font.semibold, fontSize: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipEmoji: { fontSize: 13 },
  chipLabel: { fontFamily: font.semibold, fontSize: 12 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: space.sm, paddingBottom: space.md },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerRight: { minWidth: 44, alignItems: 'flex-end' },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconSpacer: { width: 44, height: 44 },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    fontFamily: font.regular,
    fontSize: 16,
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  divider: { height: 1, backgroundColor: colors.border, width: '100%' },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  pillText: { fontFamily: font.semibold, fontSize: 11 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.xxxl,
    paddingHorizontal: space.lg,
  },
});
