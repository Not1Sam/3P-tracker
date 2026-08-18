import { format } from 'date-fns';
import { Platform } from 'react-native';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'ACTION';
type LogCategory = 'APP' | 'NAV' | 'AUTH' | 'DB' | 'SYNC' | 'UI' | 'INPUT' | 'PERIOD' | 'SOCIAL' | 'LEADERBOARD' | 'BACKUP' | 'ANIMATION' | 'API';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
}

const IS_WEB = Platform.OS === 'web';

// expo-file-system is not available on web — skip file logging
let FileSystem: typeof import('expo-file-system/legacy') | null = null;
if (!IS_WEB) {
  try {
    FileSystem = require('expo-file-system/legacy');
  } catch {}
}

const LOG_FILE = FileSystem ? `${FileSystem.documentDirectory}app-debug.log` : '';
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB

let logBuffer: LogEntry[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function formatEntry(entry: LogEntry): string {
  const dataStr = entry.data ? ` | ${JSON.stringify(entry.data)}` : '';
  return `[${entry.timestamp}] [${entry.level}] [${entry.category}] ${entry.message}${dataStr}\n`;
}

async function flushLogs(): Promise<void> {
  if (logBuffer.length === 0) return;
  if (IS_WEB || !FileSystem) {
    logBuffer = [];
    return;
  }

  const logsToWrite = [...logBuffer];
  logBuffer = [];

  try {
    const content = logsToWrite.map(formatEntry).join('');

    // Check file size, rotate if needed
    try {
      const info = await FileSystem.getInfoAsync(LOG_FILE);
      if (info.exists && info.size > MAX_LOG_SIZE) {
        // Rotate: rename old log
        const rotatedName = `${LOG_FILE}.${Date.now()}`;
        await FileSystem.moveAsync({ from: LOG_FILE, to: rotatedName });
        // Delete old rotated logs (keep last 3)
        await cleanupOldLogs();
      }
    } catch {}

    // Append to log file
    await FileSystem.writeAsStringAsync(LOG_FILE, content, {
      encoding: FileSystem.EncodingType.UTF8,
      append: true,
    });
  } catch (e) {
    // If file write fails, log to console at least
    console.warn('[Logger] Failed to write logs to file:', e);
  }
}

async function cleanupOldLogs(): Promise<void> {
  if (IS_WEB || !FileSystem) return;
  try {
    const dir = FileSystem.documentDirectory;
    if (!dir) return;
    const files = await FileSystem.readDirectoryAsync(dir);
    const logFiles = files
      .filter(f => f.startsWith('app-debug.log.'))
      .sort()
      .reverse();

    // Keep only last 2 rotated logs
    for (let i = 2; i < logFiles.length; i++) {
      await FileSystem.deleteAsync(`${dir}${logFiles[i]}`);
    }
  } catch {}
}

function startAutoFlush(): void {
  if (flushTimer || IS_WEB) return;
  flushTimer = setInterval(() => {
    flushLogs().catch(() => {});
  }, 5000); // Flush every 5 seconds
}

function ensureStarted(): void {
  if (!flushTimer) startAutoFlush();
}

function log(level: LogLevel, category: LogCategory, message: string, data?: any): void {
  const entry: LogEntry = {
    timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS'),
    level,
    category,
    message,
    data,
  };

  // Console output with color coding
  const prefix = `[${category}]`;
  switch (level) {
    case 'DEBUG':
      console.debug(`${prefix} ${message}`, data ?? '');
      break;
    case 'INFO':
      console.info(`${prefix} ${message}`, data ?? '');
      break;
    case 'WARN':
      console.warn(`${prefix} ${message}`, data ?? '');
      break;
    case 'ERROR':
      console.error(`${prefix} ${message}`, data ?? '');
      break;
    case 'ACTION':
      console.log(`${prefix} ${message}`, data ?? '');
      break;
  }

  // Buffer for file write
  logBuffer.push(entry);
  ensureStarted();
}

// ─── Public API ─────────────────────────────────────────

export const logger = {
  // App lifecycle
  appInit: (msg: string, data?: any) => log('INFO', 'APP', msg, data),
  appReady: (msg: string, data?: any) => log('INFO', 'APP', msg, data),
  appError: (msg: string, data?: any) => log('ERROR', 'APP', msg, data),

  // Navigation
  nav: (msg: string, data?: any) => log('INFO', 'NAV', msg, data),
  navTab: (tab: string) => log('ACTION', 'NAV', `Tab switch: ${tab}`),
  navScreen: (screen: string) => log('ACTION', 'NAV', `Navigate: ${screen}`),

  // Auth
  auth: (msg: string, data?: any) => log('INFO', 'AUTH', msg, data),
  authLogin: (method: string) => log('ACTION', 'AUTH', `Login: ${method}`),
  authLogout: () => log('ACTION', 'AUTH', 'Logout'),
  authRegister: () => log('ACTION', 'AUTH', 'Register'),
  authError: (msg: string, data?: any) => log('ERROR', 'AUTH', msg, data),

  // Database
  db: (msg: string, data?: any) => log('INFO', 'DB', msg, data),
  dbWrite: (table: string, data?: any) => log('ACTION', 'DB', `Write: ${table}`, data),
  dbRead: (table: string, data?: any) => log('DEBUG', 'DB', `Read: ${table}`, data),
  dbError: (msg: string, data?: any) => log('ERROR', 'DB', msg, data),

  // API
  apiError: (method: string, path: string, msg: string) => log('ERROR', 'API', `${method} ${path}: ${msg}`),

  // Sync
  sync: (msg: string, data?: any) => log('INFO', 'SYNC', msg, data),
  syncStart: (type: string) => log('ACTION', 'SYNC', `Sync start: ${type}`),
  syncComplete: (type: string, data?: any) => log('INFO', 'SYNC', `Sync complete: ${type}`, data),
  syncError: (msg: string, data?: any) => log('ERROR', 'SYNC', msg, data),

  // UI
  ui: (msg: string, data?: any) => log('INFO', 'UI', msg, data),
  uiAction: (action: string, data?: any) => log('ACTION', 'UI', action, data),
  uiError: (msg: string, data?: any) => log('ERROR', 'UI', msg, data),

  // User input
  input: (msg: string, data?: any) => log('DEBUG', 'INPUT', msg, data),
  inputAction: (action: string, data?: any) => log('ACTION', 'INPUT', action, data),

  // Period tracking
  period: (msg: string, data?: any) => log('INFO', 'PERIOD', msg, data),
  periodAction: (action: string, data?: any) => log('ACTION', 'PERIOD', action, data),

  // Social
  social: (msg: string, data?: any) => log('INFO', 'SOCIAL', msg, data),
  socialAction: (action: string, data?: any) => log('ACTION', 'SOCIAL', action, data),

  // Leaderboard
  leaderboard: (msg: string, data?: any) => log('INFO', 'LEADERBOARD', msg, data),
  leaderboardAction: (action: string, data?: any) => log('ACTION', 'LEADERBOARD', action, data),

  // Backup
  backup: (msg: string, data?: any) => log('INFO', 'BACKUP', msg, data),
  backupAction: (action: string, data?: any) => log('ACTION', 'BACKUP', action, data),
  backupError: (msg: string, data?: any) => log('ERROR', 'BACKUP', msg, data),

  // Animation
  animation: (msg: string, data?: any) => log('DEBUG', 'ANIMATION', msg, data),

  // Generic
  debug: (category: LogCategory, msg: string, data?: any) => log('DEBUG', category, msg, data),
  info: (category: LogCategory, msg: string, data?: any) => log('INFO', category, msg, data),
  warn: (category: LogCategory, msg: string, data?: any) => log('WARN', category, msg, data),
  error: (category: LogCategory, msg: string, data?: any) => log('ERROR', category, msg, data),
  action: (category: LogCategory, msg: string, data?: any) => log('ACTION', category, msg, data),

  // Flush and utilities
  flush: flushLogs,
  getLogPath: () => LOG_FILE,
  readLogs: async (): Promise<string> => {
    if (IS_WEB || !FileSystem) return '';
    try {
      return await FileSystem.readAsStringAsync(LOG_FILE, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } catch {
      return '';
    }
  },
  clearLogs: async (): Promise<void> => {
    if (IS_WEB || !FileSystem) {
      logBuffer = [];
      return;
    }
    try {
      await FileSystem.deleteAsync(LOG_FILE);
      logBuffer = [];
    } catch {}
  },
  shareLogs: async (): Promise<void> => {
    if (IS_WEB || !FileSystem) return;
    await flushLogs();
    const Sharing = require('expo-sharing');
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(LOG_FILE, {
        mimeType: 'text/plain',
        dialogTitle: 'Export app logs',
      });
    }
  },
};
