import { type TextStyle, type ViewStyle } from 'react-native';

export type ThemeMode = 'playful' | 'clinical';

export interface ThemeColors {
  // Primary
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Accent
  accent: string;
  accentLight: string;

  // Semantic
  success: string;
  warning: string;
  error: string;

  // Background
  background: string;
  surface: string;
  surfaceVariant: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Border
  border: string;
  borderLight: string;

  // Poop
  poop: string;
  poopLight: string;

  // Piss
  piss: string;
  pissLight: string;

  // Period
  period: string;
  periodLight: string;

  // Calendar
  calendarAccent: string;

  // Disabled
  disabled: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeBorderRadius {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface ThemeFontSizes {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeFontWeight {
  regular: TextStyle['fontWeight'];
  medium: TextStyle['fontWeight'];
  semibold: TextStyle['fontWeight'];
  bold: TextStyle['fontWeight'];
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  fontSizes: ThemeFontSizes;
  fontWeight: ThemeFontWeight;
}

// ─── Playful Theme ──────────────────────────────────────

const playfulColors: ThemeColors = {
  primary: '#8B4513',
  primaryLight: '#A0522D',
  primaryDark: '#6B3410',

  accent: '#FF6B6B',
  accentLight: '#FF8E8E',

  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',

  background: '#FFF8F0',
  surface: '#FFFFFF',
  surfaceVariant: '#FFF0E6',

  text: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#FFFFFF',

  border: '#E8DDD0',
  borderLight: '#F0E8DE',

  poop: '#8B4513',
  poopLight: '#D2B48C',

  piss: '#FFD700',
  pissLight: '#FFF3B0',

  period: '#E88B9D',      // D-23: Rose/coral
  periodLight: '#F5D5DD', // D-24: Light pink

  calendarAccent: '#FF6B6B',

  disabled: '#B0C4DE',
};

const clinicalColors: ThemeColors = {
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',

  accent: '#0EA5E9',
  accentLight: '#38BDF8',

  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',

  text: '#1E293B',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  poop: '#78350F',
  poopLight: '#D97706',

  piss: '#EAB308',
  pissLight: '#FDE047',

  period: '#E88B9D',
  periodLight: '#F5D5DD',

  calendarAccent: '#2563EB',

  disabled: '#CBD5E1',
};

// ─── Shared Tokens ──────────────────────────────────────

const spacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const borderRadius: ThemeBorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

const fontSizes: ThemeFontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
};

const fontWeight: ThemeFontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// ─── Theme Map ──────────────────────────────────────────

export const themes: Record<ThemeMode, Theme> = {
  playful: {
    mode: 'playful',
    colors: playfulColors,
    spacing,
    borderRadius,
    fontSizes,
    fontWeight,
  },
  clinical: {
    mode: 'clinical',
    colors: clinicalColors,
    spacing,
    borderRadius,
    fontSizes,
    fontWeight,
  },
};

export const defaultTheme: Theme = themes.playful;
