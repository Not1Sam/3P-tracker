import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { createProfile } from '@/services/profile-service';
import { Avatar } from '@/components/social/Avatar';

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export function ProfileSetup() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { refreshProfile } = useProfile();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const previewUsername = useMemo(() => {
    const trimmed = username.toLowerCase().trim();
    return trimmed.length >= 3 ? trimmed : 'preview';
  }, [username]);

  const handleCreate = async () => {
    const normalized = username.toLowerCase().trim();

    if (!normalized) {
      setError('Please enter a username');
      return;
    }

    if (!USERNAME_REGEX.test(normalized)) {
      setError('Username must be 3-20 characters: a-z, 0-9, _');
      return;
    }

    if (!user) return;

    setLoading(true);
    setError('');

    try {
      await createProfile(user.id, normalized);
      await refreshProfile();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create profile';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Avatar username={previewUsername} size={96} />
          <Text style={[styles.title, { color: colors.text }]}>Choose Your Username</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            This will be your identity on 3P Tracker
          </Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.error + '15' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Username</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setError('');
              }}
              placeholder="bingus_420"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              editable={!loading}
            />
            <Text style={[styles.hint, { color: colors.textTertiary }]}>
              3-20 characters, lowercase letters, numbers, underscores
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: loading || !username.trim() ? colors.disabled : colors.primary }]}
            onPress={handleCreate}
            disabled={loading || !username.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Create Profile</Text>
            )}
          </TouchableOpacity>
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  errorBox: {
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
