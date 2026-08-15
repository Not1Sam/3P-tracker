import { supabase } from '@/services/supabase-client';
import { getCurrentUser } from '@/services/auth-service';
import { logger } from '@/utils/logger';

export interface ActivityItem {
  id: string;
  userId: string;
  username: string;
  type: 'streak_milestone' | 'logging_goal' | 'friend_joined';
  message: string;
  createdAt: string;
}

/**
 * Record a milestone event for a user.
 */
export async function recordMilestone(
  type: ActivityItem['type'],
  message: string,
): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) {
    logger.dbError('Cannot record milestone: not authenticated');
    return { error: 'Not authenticated' };
  }

  logger.db('Recording milestone', { type, message });
  try {
    const { error } = await supabase.from('activity_feed').insert({
      user_id: user.id,
      type,
      message,
    } as any);

    if (error) throw error;
    logger.db('Milestone recorded', { type, message });
    return { error: null };
  } catch (e) {
    const message2 = e instanceof Error ? e.message : 'Failed to record milestone';
    logger.dbError('Failed to record milestone', { type, error: message2 });
    return { error: message2 };
  }
}

/**
 * Fetch activity feed for the current user's friends.
 * Returns recent milestones from friends, ordered by recency.
 */
export async function getFriendActivity(limit = 50): Promise<ActivityItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  logger.db('Fetching friend activity', { limit });
  try {
    // Get friend IDs
    const { data: friends } = await supabase
      .from('friends')
      .select('friend_id')
      .eq('user_id', user.id);

    const friendIds = friends?.map((f: any) => f.friend_id) ?? [];

    if (friendIds.length === 0) {
      logger.db('No friends found, returning empty activity');
      return [];
    }

    const { data, error } = await supabase
      .from('activity_feed')
      .select('id, user_id, type, message, created_at')
      .in('user_id', friendIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Fetch usernames separately (FK is on auth.users, not profiles)
    const userIds = [...new Set((data ?? []).map((r: any) => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds);

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p.username]));

    const activity = (data ?? []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      username: profileMap.get(row.user_id) ?? 'unknown',
      type: row.type,
      message: row.message,
      createdAt: row.created_at,
    }));
    logger.db('Friend activity fetched', { count: activity.length });
    return activity;
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : typeof e === 'object' ? JSON.stringify(e) : String(e);
    logger.dbError('Failed to fetch friend activity', { error: errorMsg });
    return [];
  }
}

/**
 * Check if a user has reached a streak milestone worth announcing.
 * Returns the milestone message if threshold met, null otherwise.
 */
export function checkStreakMilestone(streak: number): string | null {
  const milestones = [7, 14, 30, 60, 90, 180, 365];
  if (milestones.includes(streak)) {
    return `${streak}-day streak reached! 🔥`;
  }
  return null;
}

/**
 * Check if a user has reached a logging goal milestone.
 * Returns the milestone message if threshold met, null otherwise.
 */
export function checkLoggingGoal(count: number): string | null {
  const goals = [10, 25, 50, 100, 250, 500];
  if (goals.includes(count)) {
    return `Logged ${count} entries! 📊`;
  }
  return null;
}
