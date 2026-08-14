import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { LoginScreen } from '@/screens/LoginScreen';
import { RegisterScreen } from '@/screens/RegisterScreen';
import { ProfileSetup } from '@/components/social/ProfileSetup';
import { FriendListScreen } from '@/screens/FriendListScreen';
import { QRCodeDisplay } from '@/components/social/QRCodeDisplay';
import { Avatar } from '@/components/social/Avatar';
import { generateInviteCode } from '@/services/social-service';
import { exportBackup } from '@/services/backup-service';
import { hapticMedium } from '@/utils/haptics';
import { logger } from '@/utils/logger';

export function ProfileScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, friendCount, pendingReceivedCount, inviteCode, refreshInviteCode } = useProfile();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [showFriendList, setShowFriendList] = useState(false);
  const [showInviteQR, setShowInviteQR] = useState(false);

  useEffect(() => {
    logger.ui('Profile screen opened', { isAuthenticated });
    return () => { logger.ui('Profile screen closed'); };
  }, []);

  const handleAuthSuccess = () => {
    logger.auth('Auth modal closed after success');
    setShowAuthModal(false);
  };

  const handleSignOut = async () => {
    logger.auth('Sign out initiated');
    await signOut();
    logger.auth('Sign out completed');
  };

  // Loading state
  if (authLoading || profileLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
      </View>
    );
  }

  // Not authenticated — show login/register CTA
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={styles.emoji}>👤</Text>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign in to track your progress and connect with friends
        </Text>

        <TouchableOpacity
          style={[styles.authButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            logger.ui('Auth modal opened (login view)');
            setAuthView('login');
            setShowAuthModal(true);
          }}
        >
          <Text style={styles.authButtonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.registerButton, { borderColor: colors.border }]}
          onPress={() => {
            logger.ui('Auth modal opened (register view)');
            setAuthView('register');
            setShowAuthModal(true);
          }}
        >
          <Text style={[styles.registerButtonText, { color: colors.text }]}>Create Account</Text>
        </TouchableOpacity>

        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          Auth is optional — your data stays on this device
        </Text>

        <Modal
          visible={showAuthModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAuthModal(false)}
        >
          {authView === 'login' ? (
            <LoginScreen
              onSwitchToRegister={() => setAuthView('register')}
              onForgotPassword={() => {/* TODO: reset password flow */}}
              onSuccess={handleAuthSuccess}
            />
          ) : (
            <RegisterScreen
              onSwitchToLogin={() => setAuthView('login')}
              onSuccess={handleAuthSuccess}
            />
          )}
        </Modal>
      </View>
    );
  }

  // Authenticated but no profile — show setup
  if (!profile) {
    return <ProfileSetup />;
  }

  // Authenticated with profile — show full profile
  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.profileHeader}>
        <Avatar username={profile.username} size={96} />
        <Text style={[styles.username, { color: colors.text }]}>{profile.username}</Text>
        <Text style={[styles.friendCount, { color: colors.textSecondary }]}>
          {friendCount} {friendCount === 1 ? 'friend' : 'friends'}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => { logger.ui('Friend list opened'); setShowFriendList(true); }}
        >
          <View style={styles.actionRow}>
            <Text style={[styles.actionButtonText, { color: colors.textInverse }]}>
              Find Friends
            </Text>
            {pendingReceivedCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={styles.badgeText}>
                  {pendingReceivedCount > 99 ? '99+' : pendingReceivedCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={async () => {
            logger.ui('Invite QR opened');
            // If no invite code yet, generate one first
            if (!inviteCode && user) {
              const { code, error } = await generateInviteCode(user.id);
              if (!error && code) {
                await refreshInviteCode();
              }
            }
            setShowInviteQR(true);
          }}
        >
          <Text style={[styles.actionButtonText, { color: colors.textInverse }]}>
            Invite Friends
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settings}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
          onPress={async () => {
            hapticMedium();
            logger.backup('Export backup initiated');
            await exportBackup();
          }}
        >
          <Text style={[styles.actionButtonText, { color: colors.text }]}>
            Export Backup
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signOutButton, { borderColor: colors.error }]}
          onPress={handleSignOut}
        >
          <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showFriendList}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFriendList(false)}
      >
        <FriendListScreen />
      </Modal>

      <Modal
        visible={showInviteQR}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteQR(false)}
      >
        {inviteCode ? (
          <QRCodeDisplay
            inviteCode={inviteCode}
            onRegenerate={async () => {
              if (user) {
                await generateInviteCode(user.id);
                await refreshInviteCode();
              }
            }}
          />
        ) : (
          <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Generating invite code...
            </Text>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  },
  authButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  authButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 4,
  },
  friendCount: {
    fontSize: 14,
  },
  actions: {
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  badge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  settings: {
    marginTop: 'auto',
    paddingBottom: 24,
  },
  signOutButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
