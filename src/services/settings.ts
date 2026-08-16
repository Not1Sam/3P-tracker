import { Platform } from 'react-native';
import { type ThemeMode } from '@/constants/theme';
import { logger } from '@/utils/logger';

// Platform-aware storage wrapper
// Web: localStorage (sync), Native: expo-secure-store (sync via getItem/setItem)
function getSyncStorage() {
  if (Platform.OS === 'web') {
    return {
      getString(key: string): string | undefined {
        try {
          return localStorage.getItem(key) ?? undefined;
        } catch {
          return undefined;
        }
      },
      getNumber(key: string): number | undefined {
        try {
          const val = localStorage.getItem(key);
          if (val === null || val === undefined) return undefined;
          const num = Number(val);
          return isNaN(num) ? undefined : num;
        } catch {
          return undefined;
        }
      },
      set(key: string, value: string | number | boolean): void {
        try {
          localStorage.setItem(key, String(value));
        } catch {}
      },
      delete(key: string): void {
        try {
          localStorage.removeItem(key);
        } catch {}
      },
      clearAll(): void {
        const keys = [
          'theme', 'syncDayOfMonth', 'userName', 'userEmail',
          'lastSyncTimestamp', 'lastAutoBackup',
          'periodRemindersEnabled', 'periodReminderHour', 'periodReminderMinute',
          'inviteCode', 'splashScreenEnabled',
        ];
        for (const key of keys) {
          try { localStorage.removeItem(key); } catch {}
        }
      },
    };
  }

  // Native: use expo-secure-store sync methods
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SecureStore = require('expo-secure-store');
  return {
    getString(key: string): string | undefined {
      try {
        return SecureStore.getItem(key) ?? undefined;
      } catch {
        return undefined;
      }
    },
    getNumber(key: string): number | undefined {
      try {
        const val = SecureStore.getItem(key);
        if (val === null || val === undefined) return undefined;
        const num = Number(val);
        return isNaN(num) ? undefined : num;
      } catch {
        return undefined;
      }
    },
    set(key: string, value: string | number | boolean): void {
      try {
        SecureStore.setItem(key, String(value));
      } catch {}
    },
    delete(key: string): void {
      try {
        SecureStore.deleteItemAsync(key);
      } catch {}
    },
    clearAll(): void {
      const keys = [
        'theme', 'syncDayOfMonth', 'userName', 'userEmail',
        'lastSyncTimestamp', 'lastAutoBackup',
        'periodRemindersEnabled', 'periodReminderHour', 'periodReminderMinute',
        'inviteCode', 'splashScreenEnabled',
      ];
      for (const key of keys) {
        try { SecureStore.deleteItemAsync(key); } catch {}
      }
    },
  };
}

export const storage = getSyncStorage();

// Theme settings
export function getTheme(): ThemeMode {
  const stored = storage.getString('theme');
  if (stored === 'dark') return 'dark';
  if (stored === 'clinical') return 'dark'; // migrate old value
  return 'light';
}

export function setTheme(theme: ThemeMode): void {
  storage.set('theme', theme);
  logger.uiAction('Theme changed', { theme });
}

// Sync settings
export function getLastSyncTimestamp(): number {
  return storage.getNumber('lastSyncTimestamp') ?? 0;
}

export function setLastSyncTimestamp(timestamp: number): void {
  storage.set('lastSyncTimestamp', timestamp);
}

export function getSyncDayOfMonth(): number {
  return storage.getNumber('syncDayOfMonth') ?? 1;
}

export function setSyncDayOfMonth(day: number): void {
  storage.set('syncDayOfMonth', day);
  logger.uiAction('Sync day changed', { day });
}

// User settings
export function getUserName(): string | undefined {
  return storage.getString('userName');
}

export function setUserName(name: string): void {
  storage.set('userName', name);
  logger.uiAction('User name updated');
}

export function getUserEmail(): string | undefined {
  return storage.getString('userEmail');
}

export function setUserEmail(email: string): void {
  storage.set('userEmail', email);
  logger.uiAction('User email updated');
}

// Period settings (D-39)
export function getPeriodRemindersEnabled(): boolean {
  return storage.getString('periodRemindersEnabled') === 'true';
}

export function setPeriodRemindersEnabled(enabled: boolean): void {
  storage.set('periodRemindersEnabled', enabled ? 'true' : 'false');
  logger.uiAction('Period reminders toggled', { enabled });
}

export function getPeriodReminderTime(): { hour: number; minute: number } {
  const hour = storage.getNumber('periodReminderHour');
  const minute = storage.getNumber('periodReminderMinute');
  return {
    hour: hour !== undefined ? hour : 9,
    minute: minute !== undefined ? minute : 0,
  };
}

export function setPeriodReminderTime(hour: number, minute: number): void {
  storage.set('periodReminderHour', hour);
  storage.set('periodReminderMinute', minute);
  logger.uiAction('Period reminder time changed', { hour, minute });
}

// Gender settings (controls period tab visibility)
export type UserGender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export function getUserGender(): UserGender | undefined {
  const stored = storage.getString('userGender');
  if (stored === 'male' || stored === 'female' || stored === 'other' || stored === 'prefer_not_to_say') {
    return stored;
  }
  return undefined;
}

export function setUserGender(gender: UserGender): void {
  storage.set('userGender', gender);
  logger.uiAction('User gender changed', { gender });
}

// Splash screen setting
export function getSplashScreenEnabled(): boolean {
  // Default to true for existing users, but on first launch (no key set) also default to true
  const stored = storage.getString('splashScreenEnabled');
  if (stored === undefined) return true;
  return stored === 'true';
}

export function setSplashScreenEnabled(enabled: boolean): void {
  storage.set('splashScreenEnabled', enabled ? 'true' : 'false');
  logger.uiAction('Splash screen toggled', { enabled });
}
