import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { supabase } from '@/services/supabase-client';
import { logger } from '@/utils/logger';

export default function SettingsScreen() {
  const colors = useThemeColors();
  const { mode, setMode } = useTheme();
  const { user, isAuthenticated, signOut } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState(profile?.username ?? '');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Connected mode = sync enabled (default true), Local mode = no sync
  const [connectedMode, setConnectedMode] = useState(true);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const handleUpdateUsername = useCallback(async () => {
    if (!user || !username.trim()) return;
    setSaving(true);
    try {
      logger.ui('Settings: update username');
      const { updateUsername } = await import('@/services/profile-service');
      await updateUsername(user.id, username.trim());
      await refreshProfile();
      showMessage('success', 'Username updated!');
    } catch (e: any) {
      showMessage('error', e.message || 'Failed to update username');
    } finally {
      setSaving(false);
    }
  }, [user, username, refreshProfile, showMessage]);

  const handleUpdateEmail = useCallback(async () => {
    if (!user || !newEmail.trim()) return;
    setSaving(true);
    try {
      logger.ui('Settings: update email');
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      setNewEmail('');
      showMessage('success', 'Confirmation email sent — check your inbox');
    } catch (e: any) {
      showMessage('error', e.message || 'Failed to update email');
    } finally {
      setSaving(false);
    }
  }, [user, newEmail, showMessage]);

  const handleUpdatePassword = useCallback(async () => {
    if (!user || !newPassword.trim()) return;
    if (newPassword.trim().length < 6) {
      showMessage('error', 'Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      logger.ui('Settings: update password');
      const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });
      if (error) throw error;
      setNewPassword('');
      showMessage('success', 'Password updated!');
    } catch (e: any) {
      showMessage('error', e.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  }, [user, newPassword, showMessage]);

  const handleToggleTheme = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);

  const handleToggleConnectedMode = useCallback(() => {
    if (!isAuthenticated) {
      showMessage('error', 'Sign in to enable connected mode');
      return;
    }
    setConnectedMode((prev) => !prev);
    showMessage('success', connectedMode ? 'Local mode — data stays on device' : 'Connected mode — data syncs to cloud');
  }, [isAuthenticated, connectedMode, showMessage]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Status message */}
        {message && (
          <View style={[styles.messageBox, { backgroundColor: message.type === 'success' ? colors.success + '20' : colors.error + '20' }]}>
            <Text style={[styles.messageText, { color: message.type === 'success' ? colors.success : colors.error }]}>
              {message.text}
            </Text>
          </View>
        )}

        {/* Theme */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Dark Mode</Text>
              <Text style={[styles.rowSubtext, { color: colors.textTertiary }]}>
                {mode === 'light' ? 'Light' : 'Dark'}
              </Text>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={handleToggleTheme}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={mode === 'dark' ? colors.primary : colors.surface}
            />
          </View>
        </View>

        {/* Connected Mode (auth-gated) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Mode</Text>
          {isAuthenticated ? (
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Connected Mode</Text>
                <Text style={[styles.rowSubtext, { color: colors.textTertiary }]}>
                  {connectedMode ? 'Sync data to cloud & compete on leaderboards' : 'Local only — data never leaves this device'}
                </Text>
              </View>
              <Switch
                value={connectedMode}
                onValueChange={handleToggleConnectedMode}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={connectedMode ? colors.primary : colors.surface}
              />
            </View>
          ) : (
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, { color: colors.textTertiary }]}>Connected Mode</Text>
                <Text style={[styles.rowSubtext, { color: colors.textTertiary }]}>
                  Sign in to enable cloud sync & leaderboards
                </Text>
              </View>
            </View>
          )}
        </View>

        {isAuthenticated && (
          <>
            {/* Change Username */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Username</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
                  value={username}
                  onChangeText={setUsername}
                  placeholder={profile?.username ?? 'username'}
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: username !== profile?.username ? colors.primary : colors.border }]}
                  onPress={handleUpdateUsername}
                  disabled={saving || username === profile?.username}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.saveBtnText, { color: username !== profile?.username ? '#FFF' : colors.textTertiary }]}>
                    Save
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Change Email */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email</Text>
              <Text style={[styles.rowSubtext, { color: colors.textTertiary, marginBottom: 8 }]}>
                Current: {user?.email}
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder="new@email.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: newEmail.trim() ? colors.primary : colors.border }]}
                  onPress={handleUpdateEmail}
                  disabled={saving || !newEmail.trim()}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.saveBtnText, { color: newEmail.trim() ? '#FFF' : colors.textTertiary }]}>
                    Update
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Change Password */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>New Password</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
              />
              <TouchableOpacity
                style={[styles.updatePasswordBtn, { backgroundColor: newPassword.trim().length >= 6 ? colors.primary : colors.border }]}
                onPress={handleUpdatePassword}
                disabled={saving || newPassword.trim().length < 6}
                activeOpacity={0.7}
              >
                <Text style={[styles.updatePasswordBtnText, { color: newPassword.trim().length >= 6 ? '#FFF' : colors.textTertiary }]}>
                  {saving ? 'Updating...' : 'Update Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Sign Out */}
        {isAuthenticated && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.signOutBtn, { borderColor: colors.error }]}
              onPress={async () => {
                logger.ui('Settings: sign out');
                await signOut();
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.signOutBtnText, { color: colors.error }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Debug */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Debug</Text>
          <TouchableOpacity
            style={[styles.signOutBtn, { borderColor: colors.border }]}
            onPress={async () => {
              try {
                await logger.shareLogs();
              } catch (e: any) {
                showMessage('error', e.message || 'Failed to export logs');
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.signOutBtnText, { color: colors.text }]}>Export Logs</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View style={styles.footer}>
          <Text style={[styles.version, { color: colors.textTertiary }]}>3P Tracker v1.0.0</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  messageBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  rowContent: {
    flex: 1,
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  updatePasswordBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  updatePasswordBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  signOutBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  version: {
    fontSize: 13,
  },
});
