import { storage } from '@/services/settings';
import { logger } from '@/utils/logger';

/**
 * Client-side rate limiter using SecureStore.
 * Prevents duplicate entries and enforces daily caps.
 */

const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

const DAILY_CAPS: Record<string, number> = {
  poop: 10,
  piss: 20,
  period: 3,
};

/**
 * Check if a duplicate entry was logged within the dedup window.
 * @param type - 'poop' | 'piss' | 'period'
 * @param lastEntryTimestamp - ISO string or epoch ms of the last entry
 * @returns true if duplicate (blocked), false if OK
 */
export function isDuplicate(type: string, lastEntryTimestamp: string | number | null): boolean {
  if (!lastEntryTimestamp) return false;
  const last = typeof lastEntryTimestamp === 'string'
    ? new Date(lastEntryTimestamp).getTime()
    : lastEntryTimestamp;
  const now = Date.now();
  const isDup = (now - last) < DEDUP_WINDOW_MS;
  if (isDup) {
    logger.debug('APP', 'Duplicate entry detected', { type, cooldownRemaining: Math.ceil((DEDUP_WINDOW_MS - (now - last)) / 1000) });
  }
  return isDup;
}

/**
 * Get time remaining until dedup window clears.
 * @returns seconds remaining, or 0 if not in cooldown
 */
export function getDedupRemaining(lastEntryTimestamp: string | number | null): number {
  if (!lastEntryTimestamp) return 0;
  const last = typeof lastEntryTimestamp === 'string'
    ? new Date(lastEntryTimestamp).getTime()
    : lastEntryTimestamp;
  const elapsed = Date.now() - last;
  const remaining = DEDUP_WINDOW_MS - elapsed;
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

/**
 * Get today's date key for daily cap tracking.
 */
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Get the current count of entries for a type today.
 */
export function getDailyCount(type: string): number {
  const key = `daily_${type}_${getTodayKey()}`;
  return storage.getNumber(key) ?? 0;
}

/**
 * Increment the daily count for a type. Returns the new count.
 */
export function incrementDailyCount(type: string): number {
  const key = `daily_${type}_${getTodayKey()}`;
  const current = getDailyCount(type);
  const newCount = current + 1;
  storage.set(key, newCount);
  return newCount;
}

/**
 * Check if the daily cap has been reached for a type.
 */
export function isDailyCapReached(type: string): boolean {
  const cap = DAILY_CAPS[type];
  if (!cap) return false;
  const reached = getDailyCount(type) >= cap;
  if (reached) {
    logger.warn('APP', 'Daily cap reached', { type, cap });
  }
  return reached;
}

/**
 * Get remaining entries allowed today for a type.
 */
export function getDailyRemaining(type: string): number {
  const cap = DAILY_CAPS[type];
  if (!cap) return Infinity;
  return Math.max(0, cap - getDailyCount(type));
}

/**
 * Full check: can this entry be logged?
 * Returns { allowed, reason } where reason explains why blocked.
 */
export function canLogEntry(
  type: string,
  lastEntryTimestamp: string | number | null,
): { allowed: boolean; reason?: string } {
  // Check dedup
  if (isDuplicate(type, lastEntryTimestamp)) {
    const remaining = getDedupRemaining(lastEntryTimestamp);
    logger.debug('APP', 'Rate limit: dedup blocked', { type, remaining });
    return {
      allowed: false,
      reason: `Wait ${remaining}s before logging another ${type}`,
    };
  }

  // Check daily cap
  if (isDailyCapReached(type)) {
    const cap = DAILY_CAPS[type] ?? 0;
    logger.debug('APP', 'Rate limit: daily cap blocked', { type, cap });
    return {
      allowed: false,
      reason: `Daily limit reached (${cap} ${type} entries per day)`,
    };
  }

  logger.debug('APP', 'Rate limit: entry allowed', { type });
  return { allowed: true };
}
