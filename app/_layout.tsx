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
import { logger } from '@/utils/logger';
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
    logger.appInit('RootLayout: initApp called');
    try {
      const result = await initializeApp();
      setState({
        db: result.db,
        showSplash: true,
        error: null,
        initialized: true,
      });
      logger.appReady('RootLayout: initApp complete');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown initialization error';
      logger.appError('RootLayout: initApp failed', { error: message });
      setState(prev => ({
        ...prev,
        error: message,
        initialized: true,
      }));
    }
  }, []);

  useEffect(() => {
    logger.appInit('RootLayout: useEffect - calling initApp');
    initApp();
  }, [initApp]);

  // Check for updates, sync leaderboards, and auto-backup on app open
  useEffect(() => {
    if (state.initialized) {
      logger.appInit('RootLayout: Running post-init tasks');
      checkForUpdate().catch((e) => {
        logger.syncError('Update check failed', { error: e });
      });
      syncLeaderboards().catch((e) => {
        logger.syncError('Leaderboard sync failed', { error: e });
      });
      checkAutoBackup().catch((e) => {
        logger.backupError('Auto backup check failed', { error: e });
      });
    }
  }, [state.initialized]);

  const handleSplashFinish = useCallback(() => {
    logger.nav('Splash finished, showing main app');
    setState(prev => ({ ...prev, showSplash: false }));
  }, []);

  const handleRetry = useCallback(() => {
    logger.appInit('RootLayout: Retry button pressed');
    initApp();
  }, [initApp]);

  const handleReset = useCallback(async () => {
    logger.appInit('RootLayout: Reset button pressed');
    const { storage } = await import('@/services/settings');
    storage.clearAll();
    logger.appInit('Settings cleared, re-initializing');
    initApp();
  }, [initApp]);

  if (state.showSplash || !state.initialized) {
    if (state.error) {
      logger.appError('RootLayout: Showing error screen', { error: state.error });
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

  logger.nav('RootLayout: Rendering main app');
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
