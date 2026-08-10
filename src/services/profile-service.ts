import { supabase } from '@/services/supabase-client';

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
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      // PGRST116 = "Row not found" — normal for new users without profiles
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get profile';
    throw new Error(message);
  }
}

/**
 * Create a new profile with username validation.
 */
export async function createProfile(userId: string, username: string): Promise<Profile> {
  const normalized = username.toLowerCase().trim();

  if (!USERNAME_REGEX.test(normalized)) {
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
        throw new Error('Username is already taken');
      }
      throw error;
    }

    return data;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create profile';
    throw new Error(message);
  }
}

/**
 * Search users by username prefix.
 */
export async function searchUsers(query: string, limit: number = 20): Promise<{ id: string; username: string }[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', `${query.toLowerCase()}%`)
      .order('username')
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to search users';
    throw new Error(message);
  }
}

/**
 * Update a user's username.
 */
export async function updateUsername(userId: string, newUsername: string): Promise<Profile> {
  const normalized = newUsername.toLowerCase().trim();

  if (!USERNAME_REGEX.test(normalized)) {
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
        throw new Error('Username is already taken');
      }
      throw error;
    }

    return data;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to update username';
    throw new Error(message);
  }
}

/**
 * Get the number of friends for a user.
 */
export async function getFriendCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('friends')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count ?? 0;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get friend count';
    throw new Error(message);
  }
}
