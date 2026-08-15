import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { processInvite } from '@/services/social-service';
import { useThemeColors } from '@/contexts/ThemeContext';
import { logger } from '@/utils/logger';

export default function InviteHandler() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const colors = useThemeColors();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    logger.navScreen(`invite: ${code}`);
  }, [code]);

  useEffect(() => {
    if (authLoading || !code) return;

    if (!isAuthenticated) {
      logger.auth('inviteRedirectToLogin', { code });
      router.replace({
        pathname: '/(tabs)/profile',
        params: { invite: code },
      });
      return;
    }

    const handleInvite = async () => {
      if (!user) return;

      try {
        logger.socialAction('inviteProcess', { code, userId: user.id });
        const { error } = await processInvite(code, user.id);

        if (error) {
          logger.socialAction('inviteProcessError', { code, error });
          setStatus('error');
          setErrorMessage(error);
          setTimeout(() => {
            router.replace('/(tabs)/profile');
          }, 2000);
          return;
        }

        logger.socialAction('inviteProcessSuccess', { code });
        router.replace('/(tabs)/profile');
      } catch (error) {
        logger.socialAction('inviteProcessException', { code, error: String(error) });
        setStatus('error');
        setErrorMessage('Failed to process invite');
        setTimeout(() => {
          router.replace('/(tabs)/profile');
        }, 2000);
      }
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
        <MaterialCommunityIcons name="emoticon-sad-outline" size={64} color={colors.error} />
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
