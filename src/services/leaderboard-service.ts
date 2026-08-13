/**
 * Leaderboard service layer.
 * Provides score calculation, streak algorithm, and Supabase data fetching
 * for friends/global leaderboards.
 *
 * Data sources:
 * - Personal score + streak: local SQLite (poop_logs, piss_logs)
 * - Friends leaderboard: Supabase monthly_summaries + friends table
 * - Global leaderboard: Supabase monthly_summaries (top 100)
 */

import { count, and, gte, lte } from 'drizzle-orm';
import { startOfMonth, endOfMonth, startOfDay, subDays } from 'date-fns';
import { getDatabase } from '@/db';
import { poopLogs, pissLogs } from '@/db/schema';
import { supabase } from '@/services/supabase-client';
import { getCurrentUser } from '@/services/auth-service';

type LogType = 'poop' | 'piss';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  streak: number;
  isCurrentUser: boolean;
}

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

/**
 * Get friends leaderboard from Supabase.
 * Fetches friends' monthly_summaries and includes the current user.
 */
export async function getFriendsLeaderboard(type: LogType): Promise<LeaderboardEntry[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
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
  } catch {
    return [];
  }
}

/**
 * Get global leaderboard from Supabase.
 * Fetches top 100 monthly_summaries and includes the current user if not in top 100.
 */
export async function getGlobalLeaderboard(type: LogType): Promise<LeaderboardEntry[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
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
  } catch {
    return [];
  }
}
