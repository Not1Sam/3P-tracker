import 'react-native-reanimated';
import React, { useState, useEffect, useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { InitErrorScreen } from '@/components/common/InitErrorScreen';
import { OfflineBanner } from '@/components/OfflineBanner';
import { PlatformInstallModal } from '@/components/PlatformInstallModal';
import { initializeApp, runBackgroundTasks } from '@/services/app-init';
import { logger } from '@/utils/logger';

function ThemeStatusBar() {
  const { mode } = useTheme();
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  const [state, setState] = useState<{
    error: string | null;
    initialized: boolean;
  }>({
    error: null,
    initialized: false,
  });

  const initApp = useCallback(async () => {
    logger.appInit('RootLayout: initApp called');
    try {
      await initializeApp();
      setState({
        error: null,
        initialized: true,
      });
      logger.appReady('RootLayout: initApp complete');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown initialization error';
      logger.appError('RootLayout: initApp failed', { error: message });
      setState({
        error: message,
        initialized: true,
      });
    }
  }, []);

  useEffect(() => {
    logger.appInit('RootLayout: useEffect - calling initApp');
    initApp();
  }, [initApp]);

  // Fire background tasks after app is visible
  useEffect(() => {
    if (state.initialized) {
      runBackgroundTasks();
    }
  }, [state.initialized]);

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

  if (state.error) {
    logger.appError('RootLayout: Showing error screen', { error: state.error });
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <ThemeStatusBar />
          <InitErrorScreen
            error={state.error}
            onRetry={handleRetry}
            onReset={handleReset}
          />
        </ThemeProvider>
      </GestureHandlerRootView>
    );
  }

  if (!state.initialized) {
    return null;
  }

  logger.nav('RootLayout: Rendering main app');
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ThemeStatusBar />
        <AuthProvider>
          <ProfileProvider>
            <NetworkProvider>
              <OfflineBanner />
              <PlatformInstallModal />
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
