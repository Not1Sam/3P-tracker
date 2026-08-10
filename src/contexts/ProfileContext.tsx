import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as profileService from '@/services/profile-service';

interface Profile {
  id: string;
  username: string;
  created_at: string;
}

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  friendCount: number;
  refreshProfile: () => Promise<void>;
  refreshFriendCount: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

interface ProfileProviderProps {
  children: ReactNode;
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendCount, setFriendCount] = useState(0);

  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const data = await profileService.getProfile(user.id);
      setProfile(data);

      if (data) {
        const count = await profileService.getFriendCount(user.id);
        setFriendCount(count);
      }
    } catch {
      // Silently handle — profile may not exist yet
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  const refreshFriendCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await profileService.getFriendCount(user.id);
      setFriendCount(count);
    } catch {
      // Ignore errors for friend count refresh
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      refreshProfile();
    }
  }, [authLoading, refreshProfile]);

  const value: ProfileContextValue = {
    profile,
    loading,
    friendCount,
    refreshProfile,
    refreshFriendCount,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
