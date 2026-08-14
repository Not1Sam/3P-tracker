import { supabase } from '@/services/supabase-client';
import { logger } from '@/utils/logger';

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export interface Profile {
  id: string;
  username: string;
  created_at: string;
}

/**
 * Get a user's profile by their auth user ID.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  logger.db('Fetching profile', { userId });
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      // PGRST116 = "Row not found" — normal for new users without profiles
      if (error.code === 'PGRST116') {
        logger.db('Profile not found (new user)', { userId });
        return null;
      }
      throw error;
    }

    logger.db('Profile fetched', { username: data.username });
    return data;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get profile';
    logger.dbError('Failed to fetch profile', { userId, error: message });
    throw new Error(message);
  }
}

/**
 * Create a new profile with username validation.
 */
export async function createProfile(userId: string, username: string): Promise<Profile> {
  const normalized = username.toLowerCase().trim();
  logger.db('Creating profile', { userId, username: normalized });

  if (!USERNAME_REGEX.test(normalized)) {
    logger.dbError('Invalid username format', { username: normalized });
    throw new Error('Username must be 3-20 characters, lowercase letters, numbers, or underscores');
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: userId, username: normalized })
      .select('id, username, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        logger.dbError('Username already taken', { username: normalized });
        throw new Error('Username is already taken');
      }
      throw error;
    }

    logger.db('Profile created', { username: data.username });
    return data;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create profile';
    logger.dbError('Failed to create profile', { userId, username: normalized, error: message });
    throw new Error(message);
  }
}

/**
 * Search users by username prefix.
 */
export async function searchUsers(query: string, limit: number = 20): Promise<{ id: string; username: string }[]> {
  logger.db('Searching users', { query, limit });
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', `${query.toLowerCase()}%`)
      .order('username')
      .limit(limit);

    if (error) throw error;
    logger.db('User search completed', { results: data?.length ?? 0 });
    return data ?? [];
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to search users';
    logger.dbError('User search failed', { query, error: message });
    throw new Error(message);
  }
}

/**
 * Update a user's username.
 */
export async function updateUsername(userId: string, newUsername: string): Promise<Profile> {
  const normalized = newUsername.toLowerCase().trim();
  logger.db('Updating username', { userId, newUsername: normalized });

  if (!USERNAME_REGEX.test(normalized)) {
    logger.dbError('Invalid username format', { username: normalized });
    throw new Error('Username must be 3-20 characters, lowercase letters, numbers, or underscores');
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ username: normalized })
      .eq('id', userId)
      .select('id, username, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        logger.dbError('Username already taken', { username: normalized });
        throw new Error('Username is already taken');
      }
      throw error;
    }

    logger.db('Username updated', { newUsername: data.username });
    return data;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to update username';
    logger.dbError('Failed to update username', { userId, newUsername: normalized, error: message });
    throw new Error(message);
  }
}

/**
 * Get the number of friends for a user.
 */
export async function getFriendCount(userId: string): Promise<number> {
  logger.db('Fetching friend count', { userId });
  try {
    const { count, error } = await supabase
      .from('friends')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    logger.db('Friend count fetched', { count: count ?? 0 });
    return count ?? 0;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get friend count';
    logger.dbError('Failed to fetch friend count', { userId, error: message });
    throw new Error(message);
  }
}
