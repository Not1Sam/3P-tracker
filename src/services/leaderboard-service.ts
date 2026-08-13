/**
 * Leaderboard service layer.
 * Provides score calculation, streak algorithm, and Supabase data fetching
 * for friends/global leaderboards with MMKV-based offline caching.
 *
 * Data sources:
 * - Personal score + streak: local SQLite (poop_logs, piss_logs)
 * - Friends leaderboard: Supabase monthly_summaries + friends table
 * - Global leaderboard: Supabase monthly_summaries (top 100)
 *
 * Caching:
 * - Cache-first strategy: always attempt fetch, fall back to cache on failure
 * - Cache entries stored in MMKV with timestamps
 * - Server wins for conflict resolution (read-only cache, no local pushes)
 */

import { count, and, gte, lte } from 'drizzle-orm';
import { startOfMonth, endOfMonth, startOfDay, subDays } from 'date-fns';
import NetInfo from '@react-native-community/netinfo';
import { getDatabase } from '@/db';
import { poopLogs, pissLogs } from '@/db/schema';
import { supabase } from '@/services/supabase-client';
import { getCurrentUser } from '@/services/auth-service';
import { storage } from '@/services/settings';

export type LogType = 'poop' | 'piss';
type BoardType = 'friends' | 'global';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  streak: number;
  isCurrentUser: boolean;
}

interface CachedLeaderboard {
  entries: LeaderboardEntry[];
  cachedAt: number;
}

// ─── Cache Helpers ──────────────────────────────────────

function getCacheKey(type: LogType, board: BoardType): string {
  return `leaderboard_${board}_${type}`;
}

function setCachedLeaderboard(type: LogType, board: BoardType, entries: LeaderboardEntry[]): void {
  const key = getCacheKey(type, board);
  const data: CachedLeaderboard = { entries, cachedAt: Date.now() };
  storage.set(key, JSON.stringify(data));
}

function getCachedLeaderboard(type: LogType, board: BoardType): LeaderboardEntry[] | null {
  const key = getCacheKey(type, board);
  const raw = storage.getString(key);
  if (!raw) return null;
  try {
    const parsed: CachedLeaderboard = JSON.parse(raw);
    return parsed.entries;
  } catch {
    return null;
  }
}

/**
 * Get the timestamp of the last successful cache update for a given leaderboard.
 * Returns null if never cached.
 */
export function getLastCacheTime(type: LogType, board: BoardType): number | null {
  const key = getCacheKey(type, board);
  const raw = storage.getString(key);
  if (!raw) return null;
  try {
    const parsed: CachedLeaderboard = JSON.parse(raw);
    return parsed.cachedAt;
  } catch {
    return null;
  }
}

// ─── Personal Score & Streak ────────────────────────────

/**
 * Get personal score for current month from local DB.
 * Returns count of entries of the given type for the current calendar month.
 */
export async function getPersonalScore(type: LogType): Promise<number> {
  const db = await getDatabase();
  const now = new Date();
  const table = type === 'poop' ? poopLogs : pissLogs;

  const [{ result }] = await db
    .select({ result: count() })
    .from(table)
    .where(and(gte(table.timestamp, startOfMonth(now)), lte(table.timestamp, endOfMonth(now))));

  return result;
}

/**
 * Calculate streak with 1 grace day per month.
 * Counts consecutive days backwards from today, allowing 1 missing day per month.
 */
export async function calculateStreak(type: LogType): Promise<number> {
  const db = await getDatabase();
  const table = type === 'poop' ? poopLogs : pissLogs;
  const now = startOfDay(new Date());
  const cutoff = subDays(now, 365);

  // Get all timestamps going back up to 365 days
  const entries = await db
    .select({ timestamp: table.timestamp })
    .from(table)
    .where(gte(table.timestamp, cutoff))
    .orderBy(table.timestamp);

  // Extract unique day strings (YYYY-MM-DD)
  const daysWithLogs = new Set(
    entries.map(e => startOfDay(e.timestamp).toISOString().split('T')[0])
  );

  let streak = 0;
  let currentDay = now;
  let graceDaysUsed = 0;

  // First check: today must have a log to start a streak
  const todayKey = currentDay.toISOString().split('T')[0];
  if (!daysWithLogs.has(todayKey)) {
    return 0;
  }

  // Walk backwards from today
  while (currentDay >= cutoff) {
    const dayKey = currentDay.toISOString().split('T')[0];

    if (daysWithLogs.has(dayKey)) {
      streak++;
    } else if (streak > 0 && graceDaysUsed < 1) {
      // Grace day: only use if there's a logged day beyond this gap
      const hasFutureLog = Array.from(daysWithLogs).some(d => d < dayKey);
      if (hasFutureLog) {
        graceDaysUsed++;
        streak++;
      } else {
        break; // No future logs to bridge to
      }
    } else {
      break; // Streak broken
    }

    currentDay = subDays(currentDay, 1);
  }

  return streak;
}

// ─── Friends Leaderboard ────────────────────────────────

/**
 * Fetch friends leaderboard data from Supabase (internal helper).
 */
async function fetchFriendsLeaderboardFromSupabase(type: LogType): Promise<LeaderboardEntry[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  // Get friend IDs
  const { data: friends } = await supabase
    .from('friends')
    .select('friend_id')
    .eq('user_id', user.id);

  if (!friends?.length) {
    // No friends — just show self
    const score = await getPersonalScore(type);
    const streak = await calculateStreak(type);
    return [{ userId: user.id, username: 'You', score, streak, isCurrentUser: true }];
  }

  const friendIds = friends.map((f: { friend_id: string }) => f.friend_id);
  const now = new Date();
  const countCol = type === 'poop' ? 'poop_count' : 'piss_count';

  // Fetch monthly summaries for friends
  const { data: summaries } = await supabase
    .from('monthly_summaries')
    .select(`user_id, ${countCol}, profiles!monthly_summaries_user_id_fkey(username)`)
    .in('user_id', friendIds)
    .eq('month', now.getMonth() + 1)
    .eq('year', now.getFullYear());

  // Add current user's score
  const personalScore = await getPersonalScore(type);
  const personalStreak = await calculateStreak(type);

  const entries: LeaderboardEntry[] = [
    ...(summaries ?? []).map((s: any) => ({
      userId: s.user_id,
      username: s.profiles?.username ?? 'unknown',
      score: countCol === 'poop_count' ? s.poop_count : s.piss_count,
      streak: 0, // Streak only computed locally
      isCurrentUser: false,
    })),
    { userId: user.id, username: 'You', score: personalScore, streak: personalStreak, isCurrentUser: true },
  ];

  return entries.sort((a, b) => b.score - a.score);
}

/**
 * Get friends leaderboard using cache-first strategy.
 * Always attempts Supabase fetch; falls back to MMKV cache on failure.
 */
export async function getFriendsLeaderboard(type: LogType): Promise<LeaderboardEntry[]> {
  try {
    const entries = await fetchFriendsLeaderboardFromSupabase(type);
    // Success: update cache with fresh data
    setCachedLeaderboard(type, 'friends', entries);
    return entries;
  } catch {
    // Failure: return cached data or empty array
    return getCachedLeaderboard(type, 'friends') ?? [];
  }
}

// ─── Global Leaderboard ─────────────────────────────────

/**
 * Fetch global leaderboard data from Supabase (internal helper).
 */
async function fetchGlobalLeaderboardFromSupabase(type: LogType): Promise<LeaderboardEntry[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const now = new Date();
  const countCol = type === 'poop' ? 'poop_count' : 'piss_count';

  const { data: summaries } = await supabase
    .from('monthly_summaries')
    .select(`user_id, ${countCol}, profiles!monthly_summaries_user_id_fkey(username)`)
    .eq('month', now.getMonth() + 1)
    .eq('year', now.getFullYear())
    .order(countCol, { ascending: false })
    .limit(100);

  const personalScore = await getPersonalScore(type);
  const personalStreak = await calculateStreak(type);

  const entries: LeaderboardEntry[] = [
    ...(summaries ?? []).map((s: any) => ({
      userId: s.user_id,
      username: s.profiles?.username ?? 'unknown',
      score: countCol === 'poop_count' ? s.poop_count : s.piss_count,
      streak: 0,
      isCurrentUser: s.user_id === user.id,
    })),
  ];

  // Add self if not in top 100
  if (!entries.some(e => e.userId === user.id)) {
    entries.push({ userId: user.id, username: 'You', score: personalScore, streak: personalStreak, isCurrentUser: true });
  }

  return entries.sort((a, b) => b.score - a.score);
}

/**
 * Get global leaderboard using cache-first strategy.
 * Always attempts Supabase fetch; falls back to MMKV cache on failure.
 */
export async function getGlobalLeaderboard(type: LogType): Promise<LeaderboardEntry[]> {
  try {
    const entries = await fetchGlobalLeaderboardFromSupabase(type);
    // Success: update cache with fresh data
    setCachedLeaderboard(type, 'global', entries);
    return entries;
  } catch {
    // Failure: return cached data or empty array
    return getCachedLeaderboard(type, 'global') ?? [];
  }
}

// ─── Sync ───────────────────────────────────────────────

export interface SyncResult {
  synced: boolean;
  timestamp: number;
}

/**
 * Sync all leaderboards from Supabase when network is available.
 * Safe to call from non-React contexts (app open, background tasks).
 * Skips silently if offline.
 */
export async function syncLeaderboards(): Promise<SyncResult> {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected || !netState.isInternetReachable) {
    return { synced: false, timestamp: Date.now() };
  }

  try {
    // Fetch and cache all four leaderboard variants
    const [friendsPoop, friendsPiss, globalPoop, globalPiss] = await Promise.allSettled([
      fetchFriendsLeaderboardFromSupabase('poop'),
      fetchFriendsLeaderboardFromSupabase('piss'),
      fetchGlobalLeaderboardFromSupabase('poop'),
      fetchGlobalLeaderboardFromSupabase('piss'),
    ]);

    // Update cache for each that succeeded
    if (friendsPoop.status === 'fulfilled') setCachedLeaderboard('poop', 'friends', friendsPoop.value);
    if (friendsPiss.status === 'fulfilled') setCachedLeaderboard('piss', 'friends', friendsPiss.value);
    if (globalPoop.status === 'fulfilled') setCachedLeaderboard('poop', 'global', globalPoop.value);
    if (globalPiss.status === 'fulfilled') setCachedLeaderboard('piss', 'global', globalPiss.value);

    return { synced: true, timestamp: Date.now() };
  } catch {
    return { synced: false, timestamp: Date.now() };
  }
}
