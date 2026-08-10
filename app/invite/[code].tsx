import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { processInvite } from '@/services/social-service';
import { useThemeColors } from '@/contexts/ThemeContext';

export default function InviteHandler() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const colors = useThemeColors();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (authLoading || !code) return;

    if (!isAuthenticated) {
      // Store invite code in state and redirect to login with invite param
      router.replace({
        pathname: '/(tabs)/profile',
        params: { invite: code },
      });
      return;
    }

    // Process the invite
    const handleInvite = async () => {
      if (!user) return;

      const { error } = await processInvite(code, user.id);

      if (error) {
        setStatus('error');
        setErrorMessage(error);
        // Navigate to profile after a delay
        setTimeout(() => {
          router.replace('/(tabs)/profile');
        }, 2000);
        return;
      }

      // Success — navigate to profile tab
      router.replace('/(tabs)/profile');
    };

    handleInvite();
  }, [code, isAuthenticated, authLoading, user]);

  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          Processing invite...
        </Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.emoji]}>😔</Text>
        <Text style={[styles.text, { color: colors.error }]}>
          {errorMessage || 'Invalid invite link'}
        </Text>
        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          Redirecting to profile...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        Processing invite...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
});
