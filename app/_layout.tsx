import 'react-native-reanimated';
import React, { useState, useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { SplashScreen } from '@/components/common/SplashScreen';
import { InitErrorScreen } from '@/components/common/InitErrorScreen';
import { initializeApp } from '@/services/app-init';
import { SQLiteDatabase } from 'expo-sqlite';

export default function RootLayout() {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const initApp = useCallback(async () => {
    try {
      setError(null);
      const result = await initializeApp();
      setDb(result.db);
      setInitialized(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown initialization error';
      setError(message);
    }
  }, []);

  useEffect(() => {
    initApp();
  }, [initApp]);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  const handleRetry = useCallback(() => {
    initApp();
  }, [initApp]);

  const handleReset = useCallback(async () => {
    // Clear MMKV storage
    const { storage } = await import('@/services/settings');
    storage.clearAll();
    // Re-initialize
    initApp();
  }, [initApp]);

  // Show splash screen during initialization
  if (showSplash || !initialized) {
    if (error) {
      return (
        <ThemeProvider>
          <InitErrorScreen
            error={error}
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
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="entry" options={{ headerShown: false }} />
          </Stack>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
