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
import { setUserGender, type UserGender } from '@/services/settings';
import { Avatar } from '@/components/social/Avatar';
import { logger } from '@/utils/logger';

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

const GENDER_OPTIONS: { value: UserGender; label: string; emoji: string }[] = [
  { value: 'female', label: 'Female', emoji: '♀️' },
  { value: 'male', label: 'Male', emoji: '♂️' },
  { value: 'other', label: 'Other', emoji: '⚧️' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say', emoji: '🤐' },
];

type Step = 'username' | 'gender';

export function ProfileSetup() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { refreshProfile } = useProfile();
  const [step, setStep] = useState<Step>('username');
  const [username, setUsername] = useState('');
  const [selectedGender, setSelectedGender] = useState<UserGender | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const previewUsername = useMemo(() => {
    const trimmed = username.toLowerCase().trim();
    return trimmed.length >= 3 ? trimmed : 'preview';
  }, [username]);

  const handleCreateUsername = async () => {
    const normalized = username.toLowerCase().trim();
    logger.uiAction('ProfileSetup: username_create_attempt', { username: normalized });

    if (!normalized) {
      setError('Please enter a username');
      logger.uiError('ProfileSetup: username_validation_error', { reason: 'empty' });
      return;
    }

    if (!USERNAME_REGEX.test(normalized)) {
      setError('Username must be 3-20 characters: a-z, 0-9, _');
      logger.uiError('ProfileSetup: username_validation_error', { reason: 'regex_fail' });
      return;
    }

    if (!user) return;

    setLoading(true);
    setError('');

    try {
      await createProfile(user.id, normalized);
      await refreshProfile();
      logger.uiAction('ProfileSetup: username_created', { username: normalized });
      setStep('gender');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create profile';
      setError(message);
      logger.uiError('ProfileSetup: username_create_failed', { error: message });
    } finally {
      setLoading(false);
    }
  };

  const handleGenderSelect = (gender: UserGender) => {
    setSelectedGender(gender);
    logger.uiAction('ProfileSetup: gender_select', { gender });
  };

  const handleGenderConfirm = () => {
    if (selectedGender) {
      logger.uiAction('ProfileSetup: gender_confirm', { gender: selectedGender });
      setUserGender(selectedGender);
    }
  };

  if (step === 'gender') {
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
            <Text style={[styles.title, { color: colors.text }]}>What's your gender?</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              This helps us show you the right features
            </Text>
          </View>

          <View style={styles.genderGrid}>
            {GENDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.genderButton,
                  {
                    backgroundColor:
                      selectedGender === option.value
                        ? colors.primary + '20'
                        : colors.surface,
                    borderColor:
                      selectedGender === option.value
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() => { handleGenderSelect(option.value); }}
                activeOpacity={0.7}
              >
                <Text style={styles.genderEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.genderLabel,
                    {
                      color:
                        selectedGender === option.value
                          ? colors.primary
                          : colors.text,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: !selectedGender ? colors.disabled : colors.primary,
              },
            ]}
            onPress={handleGenderConfirm}
            disabled={!selectedGender}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {}}
          >
            <Text style={[styles.skipText, { color: colors.textTertiary }]}>
              Skip for now
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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
            onPress={handleCreateUsername}
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
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  genderButton: {
    width: '47%',
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  genderEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  skipText: {
    fontSize: 14,
  },
});
