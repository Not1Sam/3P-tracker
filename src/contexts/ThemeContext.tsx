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
import { logger } from '@/utils/logger';

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

  logger.ui('ThemeProvider initialized', { mode });

  useEffect(() => {
    setTheme(mode);
  }, [mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    logger.uiAction('Theme mode changed', { from: mode, to: newMode });
    setModeState(newMode);
  }, [mode]);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      logger.uiAction('Theme mode toggled', { from: prev, to: next });
      return next;
    });
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
