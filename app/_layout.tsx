import 'react-native-reanimated';
import React, { useState, useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { SplashScreen } from '@/components/common/SplashScreen';
import { InitErrorScreen } from '@/components/common/InitErrorScreen';
import { OfflineBanner } from '@/components/OfflineBanner';
import { PWAInstallHint } from '@/components/PWAInstallHint';
import { initializeApp } from '@/services/app-init';
import { checkForUpdate } from '@/services/update-checker';
import { syncLeaderboards } from '@/services/leaderboard-service';
import { checkAutoBackup } from '@/services/backup-service';
import { SQLiteDatabase } from 'expo-sqlite';

export default function RootLayout() {
  const [state, setState] = useState<{
    db: SQLiteDatabase | null;
    showSplash: boolean;
    error: string | null;
    initialized: boolean;
  }>({
    db: null,
    showSplash: true,
    error: null,
    initialized: false,
  });

  const initApp = useCallback(async () => {
    try {
      const result = await initializeApp();
      setState({
        db: result.db,
        showSplash: true,
        error: null,
        initialized: true,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown initialization error';
      setState(prev => ({
        ...prev,
        error: message,
        initialized: true,
      }));
    }
  }, []);

  useEffect(() => {
    initApp();
  }, [initApp]);

  // Check for updates, sync leaderboards, and auto-backup on app open
  useEffect(() => {
    if (state.initialized) {
      checkForUpdate().catch(() => {});
      syncLeaderboards().catch(() => {});
      checkAutoBackup().catch(() => {});
    }
  }, [state.initialized]);

  const handleSplashFinish = useCallback(() => {
    setState(prev => ({ ...prev, showSplash: false }));
  }, []);

  const handleRetry = useCallback(() => {
    initApp();
  }, [initApp]);

  const handleReset = useCallback(async () => {
    const { storage } = await import('@/services/settings');
    storage.clearAll();
    initApp();
  }, [initApp]);

  if (state.showSplash || !state.initialized) {
    if (state.error) {
      return (
        <ThemeProvider>
          <InitErrorScreen
            error={state.error}
            onRetry={handleRetry}
            onReset={handleReset}
          />
        </ThemeProvider>
      );
    }
    return (
      <ThemeProvider>
        <SplashScreen onFinish={handleSplashFinish} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <NetworkProvider>
            <OfflineBanner />
            <PWAInstallHint />
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="entry" options={{ headerShown: false }} />
            </Stack>
          </NetworkProvider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
