import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type User } from '@supabase/supabase-js';
import {
  getCurrentUser,
  signUp as signUpFn,
  signIn as signInFn,
  signOut as signOutFn,
  resetPassword as resetPasswordFn,
  onAuthStateChange,
} from '@/services/auth-service';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });

    // Listen for auth changes
    const unsubscribe = onAuthStateChange((u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const result = await signUpFn(email, password);
    return { error: result.error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await signInFn(email, password);
    return { error: result.error };
  }, []);

  const signOut = useCallback(async () => {
    const result = await signOutFn();
    return result;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const result = await resetPasswordFn(email);
    return result;
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
