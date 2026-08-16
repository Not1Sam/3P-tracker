import 'react-native-reanimated';
import React, { useState, useEffect, useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
import { runMonthlySync } from '@/services/sync-engine';
import { checkAutoBackup } from '@/services/backup-service';
import { getSplashScreenEnabled } from '@/services/settings';
import { logger } from '@/utils/logger';

export default function RootLayout() {
  const [state, setState] = useState<{
    showSplash: boolean;
    error: string | null;
    initialized: boolean;
  }>({
    showSplash: getSplashScreenEnabled(),
    error: null,
    initialized: false,
  });

  const initApp = useCallback(async () => {
    logger.appInit('RootLayout: initApp called');
    try {
      await initializeApp();
      setState({
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
      runMonthlySync().catch((e) => {
        logger.syncError('Monthly sync failed', { error: e });
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
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider>
            <InitErrorScreen
              error={state.error}
              onRetry={handleRetry}
              onReset={handleReset}
            />
          </ThemeProvider>
        </GestureHandlerRootView>
      );
    }
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <SplashScreen onFinish={handleSplashFinish} />
        </ThemeProvider>
      </GestureHandlerRootView>
    );
  }

  logger.nav('RootLayout: Rendering main app');
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <ProfileProvider>
            <NetworkProvider>
              <OfflineBanner />
              <PWAInstallHint />
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="calendar" options={{ headerShown: false }} />
                <Stack.Screen name="activity" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ headerShown: false }} />
                <Stack.Screen name="profile" options={{ headerShown: false }} />
                <Stack.Screen name="entry/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="entry/day/[date]" options={{ headerShown: false }} />
                <Stack.Screen name="invite/[code]" options={{ headerShown: false }} />
              </Stack>
            </NetworkProvider>
          </ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
