import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  type Theme,
  type ThemeMode,
  type ThemeColors,
  type ThemeSpacing,
  type ThemeBorderRadius,
  type ThemeFontSizes,
  themes,
} from '@/constants/theme';
import { getTheme, setTheme } from '@/services/settings';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
}

export function ThemeProvider({ children, initialMode }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (initialMode) return initialMode;
    return getTheme();
  });

  useEffect(() => {
    setTheme(mode);
  }, [mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === 'playful' ? 'clinical' : 'playful'));
  }, []);

  const value: ThemeContextValue = {
    theme: themes[mode],
    mode,
    setMode,
    toggleMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useThemeColors(): ThemeColors {
  const { theme } = useTheme();
  return theme.colors;
}

export function useThemeSpacing(): ThemeSpacing {
  const { theme } = useTheme();
  return theme.spacing;
}

// Re-export types
export type { Theme, ThemeMode, ThemeColors, ThemeSpacing, ThemeBorderRadius, ThemeFontSizes };
