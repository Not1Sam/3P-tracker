import { createMMKV } from 'react-native-mmkv';
import { type ThemeMode } from '@/constants/theme';

// Singleton MMKV instance for user settings
export const storage = createMMKV({
  id: 'user-settings',
});

// Theme settings
export function getTheme(): ThemeMode {
  const stored = storage.getString('theme');
  return stored === 'clinical' ? 'clinical' : 'playful';
}

export function setTheme(theme: ThemeMode): void {
  storage.set('theme', theme);
}

// Sync settings
export function getLastSyncTimestamp(): number {
  return storage.getNumber('lastSyncTimestamp') ?? 0;
}

export function setLastSyncTimestamp(timestamp: number): void {
  storage.set('lastSyncTimestamp', timestamp);
}

export function getSyncDayOfMonth(): number {
  return storage.getNumber('syncDayOfMonth') ?? 1; // Default: 1st of each month
}

export function setSyncDayOfMonth(day: number): void {
  storage.set('syncDayOfMonth', day);
}

// User settings
export function getUserName(): string | undefined {
  return storage.getString('userName');
}

export function setUserName(name: string): void {
  storage.set('userName', name);
}

export function getUserEmail(): string | undefined {
  return storage.getString('userEmail');
}

export function setUserEmail(email: string): void {
  storage.set('userEmail', email);
}

// Period settings (D-39)
export function getPeriodRemindersEnabled(): boolean {
  return storage.getString('periodRemindersEnabled') === 'true';
}

export function setPeriodRemindersEnabled(enabled: boolean): void {
  storage.set('periodRemindersEnabled', enabled ? 'true' : 'false');
}

export function getPeriodReminderTime(): { hour: number; minute: number } {
  const hour = storage.getNumber('periodReminderHour');
  const minute = storage.getNumber('periodReminderMinute');
  return {
    hour: hour !== undefined ? hour : 9, // Default 9 AM
    minute: minute !== undefined ? minute : 0,
  };
}

export function setPeriodReminderTime(hour: number, minute: number): void {
  storage.set('periodReminderHour', hour);
  storage.set('periodReminderMinute', minute);
}
