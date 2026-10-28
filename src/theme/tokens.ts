export const colors = {
  bg: '#F7F8FC',
  surface: '#FFFFFF',
  surfaceAlt: '#E6E9FD',
  border: '#E4E7F0',
  text: '#12172B',
  muted: '#5B6280',
  primary: '#3B4FE0',
  primarySoft: '#E6E9FD',
  accent: '#FF5A4F',
  accentSoft: '#FFE9E7',
  success: '#12B76A',
  successSoft: '#E7F8F0',
  warning: '#F9C52B',
  danger: '#D92D20',
  dangerSoft: '#FDECEA',
  white: '#FFFFFF',
  overlay: 'rgba(18, 23, 43, 0.45)',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const shadow = {
  card: {
    shadowColor: '#12172B',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#3B4FE0',
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const;

export const layout = {
  screenPadding: 16,
  maxWidth: 480,
} as const;
