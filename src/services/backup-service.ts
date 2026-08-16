import * as FileSystem from 'expo-file-system/legacy';
import { getAllPoopLogs, insertPoopLog } from '@/db/repositories/poop-repository';
import { getAllPissLogs, insertPissLog } from '@/db/repositories/piss-repository';
import { getAllCustomTypes, insertCustomType } from '@/db/repositories/custom-type-repository';
import { storage } from '@/services/settings';
import * as Sharing from 'expo-sharing';
import { logger } from '@/utils/logger';

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
  logger.backupAction('Export backup started');
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
    logger.backup('Backup file written', { filename, poopCount: poop.length, pissCount: piss.length, customCount: customs.length });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/json',
        dialogTitle: 'Export 3P Tracker Backup',
      });
      logger.backupAction('Backup shared via system dialog');
    }

    logger.backupAction('Export backup completed', { uri });
    return { uri, error: null };
  } catch (e) {
    logger.backupError('Export backup failed', { error: e instanceof Error ? e.message : 'Export failed' });
    return { uri: null, error: e instanceof Error ? e.message : 'Export failed' };
  }
}

export async function importBackup(uri: string): Promise<{ imported: boolean; error: string | null }> {
  logger.backupAction('Import backup started', { uri });
  try {
    const json = await FileSystem.readAsStringAsync(uri);
    const backup: BackupData = JSON.parse(json);

    if (backup.version !== 1) {
      logger.backupError('Unsupported backup version', { version: backup.version });
      return { imported: false, error: 'Unsupported backup version' };
    }

    // Restore settings
    if (backup.settings) {
      for (const [key, val] of Object.entries(backup.settings)) {
        storage.set(key, val);
      }
      logger.backup('Settings restored', { keys: Object.keys(backup.settings).length });
    }

    // Restore poop logs
    for (const row of backup.poopLogs) {
      await insertPoopLog(row);
    }
    logger.backup('Poop logs restored', { count: backup.poopLogs.length });

    // Restore piss logs
    for (const row of backup.pissLogs) {
      await insertPissLog(row);
    }
    logger.backup('Piss logs restored', { count: backup.pissLogs.length });

    // Restore custom types
    for (const row of backup.customTypes) {
      await insertCustomType(row);
    }
    logger.backup('Custom types restored', { count: backup.customTypes.length });

    logger.backupAction('Import backup completed');
    return { imported: true, error: null };
  } catch (e) {
    logger.backupError('Import backup failed', { error: e instanceof Error ? e.message : 'Import failed' });
    return { imported: false, error: e instanceof Error ? e.message : 'Import failed' };
  }
}

export async function checkAutoBackup(): Promise<void> {
  const lastBackup = storage.getNumber('lastAutoBackup') ?? 0;
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  // First launch — no backup timestamp yet, skip and set it so it doesn't trigger immediately
  if (lastBackup === 0) {
    storage.set('lastAutoBackup', now);
    logger.backup('First launch — skipping auto-backup, timestamp initialized');
    return;
  }

  const daysSinceBackup = Math.floor((now - lastBackup) / (24 * 60 * 60 * 1000));
  logger.backup('Checking auto-backup', { daysSinceBackup, lastBackupTimestamp: lastBackup });

  if (now - lastBackup >= sevenDays) {
    logger.backupAction('Auto-backup triggered');
    const { uri, error } = await exportBackup();
    if (!error && uri) {
      storage.set('lastAutoBackup', now);
      logger.backup('Auto-backup completed', { uri });
    } else {
      logger.backupError('Auto-backup failed');
    }
  }
}
