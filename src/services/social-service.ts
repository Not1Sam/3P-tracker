import { supabase } from '@/services/supabase-client';

/**
 * Get list of friends for a user.
 * Returns array of { friend_id, username }.
 */
export async function getFriends(userId: string): Promise<{ friend_id: string; username: string }[]> {
  try {
    const { data, error } = await supabase
      .from('friends')
      .select('friend_id, profiles!friends_friend_id_fkey(username)')
      .eq('user_id', userId)
      .order('friend_id');

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      friend_id: row.friend_id,
      username: row.profiles?.username ?? 'unknown',
    }));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get friends';
    throw new Error(message);
  }
}

/**
 * Get pending received friend requests for a user.
 * Returns array of { id, sender_id, username }.
 */
export async function getPendingReceivedRequests(userId: string): Promise<{ id: string; sender_id: string; username: string }[]> {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('id, sender_id, profiles!friend_requests_sender_id_fkey(username)')
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      id: row.id,
      sender_id: row.sender_id,
      username: row.profiles?.username ?? 'unknown',
    }));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get pending received requests';
    throw new Error(message);
  }
}

/**
 * Get pending sent friend requests for a user.
 * Returns array of { id, receiver_id, username }.
 */
export async function getPendingSentRequests(userId: string): Promise<{ id: string; receiver_id: string; username: string }[]> {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('id, receiver_id, profiles!friend_requests_receiver_id_fkey(username)')
      .eq('sender_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      id: row.id,
      receiver_id: row.receiver_id,
      username: row.profiles?.username ?? 'unknown',
    }));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get pending sent requests';
    throw new Error(message);
  }
}

/**
 * Send a friend request from senderId to receiverId.
 * Checks if already friends before inserting.
 */
export async function sendFriendRequest(
  senderId: string,
  receiverId: string,
): Promise<{ error: string | null }> {
  try {
    // Check if already friends
    const alreadyFriends = await areFriends(senderId, receiverId);
    if (alreadyFriends) {
      return { error: 'Already friends' };
    }

    // Check if there's already a pending request between these users
    const hasPending = await hasPendingRequest(senderId, receiverId);
    if (hasPending) {
      return { error: 'Friend request already pending' };
    }

    const { error } = await supabase.from('friend_requests').insert({
      sender_id: senderId,
      receiver_id: receiverId,
      status: 'pending',
    });

    if (error) throw error;
    return { error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to send friend request';
    return { error: message };
  }
}

/**
 * Accept a friend request. Creates symmetric friendship (both directions).
 */
export async function acceptFriendRequest(requestId: string): Promise<{ error: string | null }> {
  try {
    // Get the request
    const { data: request, error: fetchError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError) throw fetchError;
    if (!request) throw new Error('Friend request not found');

    // Create symmetric friendship (both directions)
    const { error: insertError } = await supabase.from('friends').insert([
      { user_id: request.sender_id, friend_id: request.receiver_id },
      { user_id: request.receiver_id, friend_id: request.sender_id },
    ]);

    if (insertError) throw insertError;

    // Delete the request
    const { error: deleteError } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId);

    if (deleteError) throw deleteError;

    return { error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to accept friend request';
    return { error: message };
  }
}

/**
 * Reject a friend request.
 */
export async function rejectFriendRequest(requestId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) throw error;
    return { error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to reject friend request';
    return { error: message };
  }
}

/**
 * Cancel a sent friend request.
 */
export async function cancelFriendRequest(
  requestId: string,
  senderId: string,
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId)
      .eq('sender_id', senderId);

    if (error) throw error;
    return { error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to cancel friend request';
    return { error: message };
  }
}

/**
 * Remove a friend. Deletes both directions for clean removal.
 */
export async function removeFriend(
  userId: string,
  friendId: string,
): Promise<{ error: string | null }> {
  try {
    // Delete both directions
    const { error: error1 } = await supabase
      .from('friends')
      .delete()
      .eq('user_id', userId)
      .eq('friend_id', friendId);

    if (error1) throw error1;

    const { error: error2 } = await supabase
      .from('friends')
      .delete()
      .eq('user_id', friendId)
      .eq('friend_id', userId);

    if (error2) throw error2;

    return { error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to remove friend';
    return { error: message };
  }
}

/**
 * Check if two users are friends.
 */
export async function areFriends(userId: string, otherUserId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('friends')
      .select('user_id')
      .eq('user_id', userId)
      .eq('friend_id', otherUserId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch {
    return false;
  }
}

/**
 * Check if there's a pending request between two users (either direction).
 */
export async function hasPendingRequest(userId: string, otherUserId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('id')
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
      )
      .eq('status', 'pending')
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch {
    return false;
  }
}

// ─── Invite Operations ────────────────────────────────────

/**
 * Generate an invite URL for a given invite code.
 * Format: https://tracker.app/invite/{code}
 */
export function getInviteUrl(code: string): string {
  return `https://tracker.app/invite/${code}`;
}

/**
 * Generate a new invite code for a user.
 * Deletes any existing unused codes first (regeneration behavior per D-26).
 */
export async function generateInviteCode(
  userId: string,
): Promise<{ code: string; error: string | null }> {
  try {
    // Delete existing unused codes for this user (per D-26: regenerate invalidates old ones)
    const { error: deleteError } = await supabase
      .from('invite_codes')
      .delete()
      .eq('user_id', userId)
      .eq('used', false);

    if (deleteError) throw deleteError;

    // Insert new invite code with generated UUID
    const { data, error: insertError } = await supabase
      .from('invite_codes')
      .insert({
        user_id: userId,
        code: crypto.randomUUID(),
        used: false,
      })
      .select('code')
      .single();

    if (insertError) throw insertError;

    return { code: data.code, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to generate invite code';
    return { code: '', error: message };
  }
}

/**
 * Get the active (unused) invite code for a user.
 */
export async function getActiveInviteCode(
  userId: string,
): Promise<{ code: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('invite_codes')
      .select('code')
      .eq('user_id', userId)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return { code: data?.code ?? null, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get active invite code';
    return { code: null, error: message };
  }
}

/**
 * Validate an invite code and return the invite details.
 */
export async function validateInviteCode(
  code: string,
): Promise<{ invite: { id: string; user_id: string } | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('invite_codes')
      .select('id, user_id')
      .eq('code', code)
      .eq('used', false)
      .maybeSingle();

    if (error) throw error;

    return { invite: data, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to validate invite code';
    return { invite: null, error: message };
  }
}

/**
 * Process an invite code: mark as used and send a friend request to the inviter.
 * Per D-25: invite codes are single-use.
 */
export async function processInvite(
  code: string,
  newUserId: string,
): Promise<{ error: string | null }> {
  try {
    // Validate the invite code
    const { invite, error: validateError } = await validateInviteCode(code);
    if (validateError) throw new Error(validateError);
    if (!invite) throw new Error('Invalid or already used invite code');

    // Mark invite as used
    const { error: updateError } = await supabase
      .from('invite_codes')
      .update({ used: true, used_by: newUserId })
      .eq('id', invite.id);

    if (updateError) throw updateError;

    // Send friend request from new user to inviter
    const { error: requestError } = await sendFriendRequest(newUserId, invite.user_id);
    if (requestError) throw new Error(requestError);

    return { error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to process invite';
    return { error: message };
  }
}

/**
 * Regenerate an invite code for a user.
 * Deletes existing unused codes and generates a new one.
 */
export async function regenerateInviteCode(
  userId: string,
): Promise<{ code: string; error: string | null }> {
  return generateInviteCode(userId);
}
