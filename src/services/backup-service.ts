import * as FileSystem from 'expo-file-system/legacy';
import { getAllPoopLogs, insertPoopLog } from '@/db/repositories/poop-repository';
import { getAllPissLogs, insertPissLog } from '@/db/repositories/piss-repository';
import { getAllCustomTypes, insertCustomType } from '@/db/repositories/custom-type-repository';
import { storage } from '@/services/settings';
import * as Sharing from 'expo-sharing';

interface BackupData {
  version: 1;
  createdAt: string;
  settings: Record<string, string>;
  poopLogs: any[];
  pissLogs: any[];
  customTypes: any[];
}

function cleanRow(row: any): any {
  const cleaned = { ...row };
  delete cleaned.id;
  return cleaned;
}

export async function exportBackup(): Promise<{ uri: string | null; error: string | null }> {
  try {
    // Export non-period data only (D-09: period never leaves device)
    const [poop, piss, customs] = await Promise.all([
      getAllPoopLogs(),
      getAllPissLogs(),
      getAllCustomTypes(),
    ]);

    // Export relevant MMKV settings
    const settings: Record<string, string> = {};
    const keys = ['theme', 'syncDayOfMonth', 'userName', 'userEmail', 'periodRemindersEnabled', 'periodReminderHour', 'periodReminderMinute'];
    for (const key of keys) {
      const val = storage.getString(key);
      if (val !== undefined) settings[key] = val;
    }

    const backup: BackupData = {
      version: 1,
      createdAt: new Date().toISOString(),
      settings,
      poopLogs: poop.map(cleanRow),
      pissLogs: piss.map(cleanRow),
      customTypes: customs.map(cleanRow),
    };

    const json = JSON.stringify(backup, null, 2);
    const filename = `3ptracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    const uri = `${FileSystem.documentDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(uri, json);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/json',
        dialogTitle: 'Export 3P Tracker Backup',
      });
    }

    return { uri, error: null };
  } catch (e) {
    return { uri: null, error: e instanceof Error ? e.message : 'Export failed' };
  }
}

export async function importBackup(uri: string): Promise<{ imported: boolean; error: string | null }> {
  try {
    const json = await FileSystem.readAsStringAsync(uri);
    const backup: BackupData = JSON.parse(json);

    if (backup.version !== 1) {
      return { imported: false, error: 'Unsupported backup version' };
    }

    // Restore settings
    if (backup.settings) {
      for (const [key, val] of Object.entries(backup.settings)) {
        storage.set(key, val);
      }
    }

    // Restore poop logs
    for (const row of backup.poopLogs) {
      await insertPoopLog(row);
    }

    // Restore piss logs
    for (const row of backup.pissLogs) {
      await insertPissLog(row);
    }

    // Restore custom types
    for (const row of backup.customTypes) {
      await insertCustomType(row);
    }

    return { imported: true, error: null };
  } catch (e) {
    return { imported: false, error: e instanceof Error ? e.message : 'Import failed' };
  }
}

export async function checkAutoBackup(): Promise<void> {
  const lastBackup = storage.getNumber('lastAutoBackup') ?? 0;
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  if (now - lastBackup >= sevenDays) {
    const { uri, error } = await exportBackup();
    if (!error && uri) {
      storage.set('lastAutoBackup', now);
    }
  }
}
