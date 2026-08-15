import { type TextStyle } from 'react-native';

export type ThemeMode = 'light' | 'dark';

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
  /** Apple Design: Display size for hero text */
  display: number;
}

export interface ThemeFontWeight {
  regular: TextStyle['fontWeight'];
  medium: TextStyle['fontWeight'];
  semibold: TextStyle['fontWeight'];
  bold: TextStyle['fontWeight'];
}

// Apple Design: Typography tokens — tracking (letter-spacing) and leading (line-height)
export interface ThemeTypography {
  /** Letter-spacing for each size tier. Large text gets negative tracking, small gets positive. */
  tracking: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    display: number;
  };
  /** Line-height multiplier for each size tier. Tighter for large, looser for small. */
  leading: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    display: number;
  };
}

// Claymorphism: Multi-layer shadow system for depth
export interface ThemeShadows {
  /** Subtle shadow for cards and surfaces */
  sm: TextStyle;
  /** Medium shadow for elevated elements */
  md: TextStyle;
  /** Large shadow for modals and sheets */
  lg: TextStyle;
  /** Clay depth shadow — multi-layer for 3D effect */
  clay: TextStyle;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  fontSizes: ThemeFontSizes;
  fontWeight: ThemeFontWeight;
  typography: ThemeTypography;
  shadows: ThemeShadows;
}

// ─── Light Theme ──────────────────────────────────────
// Design System: Claymorphism (Mobile)
// Style: Soft, bubbly, playful, rounded, tactile
// Colors: Calming lavender + wellness green

const lightColors: ThemeColors = {
  // Primary: Lavender (#8B5CF6)
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',

  // Accent: Wellness Green (#059669) — WCAG 3:1 compliant
  accent: '#059669',
  accentLight: '#34D399',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#DC2626',

  // Background: Soft lavender tint
  background: '#FAF5FF',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F3FF',

  // Text
  text: '#1E1B4B',       // Deep indigo for contrast
  textSecondary: '#4C1D95',
  textTertiary: '#7C3AED',
  textInverse: '#FFFFFF',

  // Border
  border: '#EDE9FE',
  borderLight: '#F5F3FF',

  // Poop: Brown tones
  poop: '#92400E',
  poopLight: '#D97706',

  // Piss: Gold tones
  piss: '#EAB308',
  pissLight: '#FDE047',

  // Period: Rose/coral
  period: '#F472B6',
  periodLight: '#FBCFE8',

  // Calendar accent
  calendarAccent: '#8B5CF6',

  // Disabled
  disabled: '#C4B5FD',
};

const darkColors: ThemeColors = {
  primary: '#818CF8',
  primaryLight: '#A5B4FC',
  primaryDark: '#6366F1',

  accent: '#34D399',
  accentLight: '#6EE7B7',

  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',

  background: '#0F0D1A',
  surface: '#1A1726',
  surfaceVariant: '#231F30',

  text: '#F1F0F5',
  textSecondary: '#C4C1D0',
  textTertiary: '#7C7A8A',
  textInverse: '#0F0D1A',

  border: '#2D2A3A',
  borderLight: '#231F30',

  poop: '#D97706',
  poopLight: '#FBBF24',

  piss: '#FACC15',
  pissLight: '#FDE68A',

  period: '#FB7185',
  periodLight: '#FECDD3',

  calendarAccent: '#818CF8',

  disabled: '#3D3A4A',
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

// Claymorphism: Large, soft corners for tactile feel
const borderRadius: ThemeBorderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
};

const fontSizes: ThemeFontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  display: 32,
};

const fontWeight: ThemeFontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// Apple Design: Typography — size-specific tracking and leading
// Large text gets negative tracking (letters read too far apart as they grow)
// Small text gets slightly positive tracking for legibility
const typography: ThemeTypography = {
  tracking: {
    xs: 0.2,    // Small labels — slightly positive for legibility
    sm: 0.1,
    md: 0,       // Body — neutral
    lg: -0.2,    // Subheadings — slight negative
    xl: -0.3,    // Headings — negative
    xxl: -0.4,   // Titles — tighter
    display: -0.5, // Hero text — tightest
  },
  leading: {
    xs: 1.4,     // Small text — more breathing room
    sm: 1.35,
    md: 1.5,     // Body — comfortable
    lg: 1.3,     // Subheadings — tighter
    xl: 1.2,     // Headings — tight
    xxl: 1.15,
    display: 1.05, // Hero text — very tight
  },
};

// Claymorphism: Multi-layer shadow system for 3D depth (light mode uses purple-tinted shadows)
const shadows: ThemeShadows = {
  sm: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  clay: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Dark mode shadows — subtle, minimal
const darkShadows: ThemeShadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  clay: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};

// ─── Theme Map ──────────────────────────────────────────

export const themes: Record<ThemeMode, Theme> = {
  light: {
    mode: 'light',
    colors: lightColors,
    spacing,
    borderRadius,
    fontSizes,
    fontWeight,
    typography,
    shadows,
  },
  dark: {
    mode: 'dark',
    colors: darkColors,
    spacing,
    borderRadius,
    fontSizes,
    fontWeight,
    typography,
    shadows: darkShadows,
  },
};

export const defaultTheme: Theme = themes.light;
