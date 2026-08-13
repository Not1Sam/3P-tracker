import { supabase } from '@/services/supabase-client';
import type { User, AuthError } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

export interface AuthResult {
  user: User | null;
  error: string | null;
}

/**
 * Sign up with email and password.
 */
export async function signUp(email: string, password: string): Promise<AuthResult> {
  logger.auth('Attempting sign up', { email });
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      logger.authError('Sign up failed', { error: error.message });
      return { user: null, error: error.message };
    }

    logger.authLogin('email');
    return { user: data.user, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sign up failed';
    logger.authError('Sign up exception', { error: message });
    return { user: null, error: message };
  }
}

/**
 * Sign in with email and password.
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  logger.auth('Attempting sign in', { email });
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.authError('Sign in failed', { error: error.message });
      return { user: null, error: error.message };
    }

    logger.authLogin('email');
    return { user: data.user, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sign in failed';
    logger.authError('Sign in exception', { error: message });
    return { user: null, error: message };
  }
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<{ error: string | null }> {
  logger.authLogout();
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.authError('Sign out failed', { error: error.message });
      return { error: error.message };
    }
    return { error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sign out failed';
    logger.authError('Sign out exception', { error: message });
    return { error: message };
  }
}

/**
 * Get the current user session.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    logger.auth(user ? `User session found: ${user.id}` : 'No user session');
    return user;
  } catch (e) {
    logger.authError('Failed to get session');
    return null;
  }
}

/**
 * Get the current session.
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      logger.authError('Get session failed', { error: error.message });
      return { session: null, error: error.message };
    }
    return { session, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get session';
    logger.authError('Get session exception', { error: message });
    return { session: null, error: message };
  }
}

/**
 * Send password reset email.
 */
export async function resetPassword(email: string): Promise<{ error: string | null }> {
  logger.auth('Password reset requested', { email });
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      logger.authError('Password reset failed', { error: error.message });
      return { error: error.message };
    }
    logger.auth('Password reset email sent');
    return { error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Password reset failed';
    logger.authError('Password reset exception', { error: message });
    return { error: message };
  }
}

/**
 * Listen for auth state changes.
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  logger.auth('Setting up auth state listener');
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      logger.auth(`Auth state changed: ${_event}`, { userId: session?.user?.id });
      callback(session?.user ?? null);
    }
  );

  return () => {
    logger.auth('Auth state listener removed');
    subscription.unsubscribe();
  };
}
