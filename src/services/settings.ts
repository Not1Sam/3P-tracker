import { createMMKV } from 'react-native-mmkv';

// Singleton MMKV instance for user settings
export const storage = createMMKV({
  id: 'user-settings',
});

// Theme settings
export function getTheme(): string {
  return storage.getString('theme') ?? 'light';
}

export function setTheme(theme: string): void {
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
