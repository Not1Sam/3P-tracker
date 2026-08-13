import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import type { VersionInfo } from '@/services/update-checker';
import { promptUpdate } from '@/services/update-checker';

interface UpdatePromptProps {
  versionInfo: VersionInfo | null;
  onDismiss: () => void;
}

export function UpdatePrompt({ versionInfo, onDismiss }: UpdatePromptProps) {
  const colors = useThemeColors();

  if (!versionInfo) return null;

  const handleDownload = () => {
    promptUpdate(versionInfo);
    onDismiss();
  };

  return (
    <Modal
      visible={!!versionInfo}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface }]}
          accessibilityLabel={`Update available: version ${versionInfo.version}`}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Update Available
          </Text>

          <Text style={[styles.version, { color: colors.textSecondary }]}>
            Version {versionInfo.version}
          </Text>

          <Text
            style={[styles.releaseNotes, { color: colors.textSecondary }]}
            numberOfLines={3}
          >
            {versionInfo.releaseNotes}
          </Text>

          <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: colors.primary }]}
            onPress={handleDownload}
            accessibilityLabel="Download Update"
            accessibilityRole="button"
          >
            <Text style={styles.downloadText}>Download Update</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.laterButton}
            onPress={onDismiss}
            accessibilityLabel="Dismiss update"
            accessibilityRole="button"
          >
            <Text style={[styles.laterText, { color: colors.textSecondary }]}>
              Later
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 320,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    marginBottom: 12,
  },
  releaseNotes: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  downloadButton: {
    width: '100%',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  downloadText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  laterButton: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
  },
  laterText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
