import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getInviteUrl } from '@/services/social-service';
import { Toast } from '@/components/common/Toast';

interface QRCodeDisplayProps {
  inviteCode: string;
  onRegenerate: () => void;
}

export function QRCodeDisplay({ inviteCode, onRegenerate }: QRCodeDisplayProps) {
  const colors = useThemeColors();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const inviteUrl = getInviteUrl(inviteCode);

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(inviteUrl);
      setToastMessage('Invite link copied!');
      setShowToast(true);
    } catch {
      setToastMessage('Failed to copy link');
      setShowToast(true);
    }
  };

  const handleShareLink = async () => {
    try {
      setIsSharing(true);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(inviteUrl, {
          dialogTitle: 'Add me on 3P Tracker!',
          mimeType: 'text/plain',
        });
      } else {
        // Fallback: copy to clipboard
        await Clipboard.setStringAsync(inviteUrl);
        setToastMessage('Link copied (sharing not available)');
        setShowToast(true);
      }
    } catch {
      setToastMessage('Failed to share link');
      setShowToast(true);
    } finally {
      setIsSharing(false);
    }
  };

  const handleRegenerate = () => {
    Alert.alert(
      'Regenerate Code',
      'This will invalidate your current invite link. Anyone with the old link won\'t be able to use it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Regenerate', style: 'destructive', onPress: onRegenerate },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>Invite Friends</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Scan this QR code or share the link below
      </Text>

      <View style={styles.qrWrapper}>
        <QRCode
          value={inviteUrl}
          size={250}
          backgroundColor={colors.surface}
          color={colors.text}
        />
      </View>

      <Text style={[styles.linkLabel, { color: colors.textTertiary }]}>
        Or copy the link:
      </Text>

      <TouchableOpacity
        style={[styles.linkBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
        onPress={handleCopyLink}
        activeOpacity={0.7}
      >
        <Text style={[styles.linkText, { color: colors.text }]} numberOfLines={1}>
          {inviteUrl}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.shareButton, { backgroundColor: colors.primary }]}
        onPress={handleShareLink}
        disabled={isSharing}
      >
        {isSharing ? (
          <ActivityIndicator size="small" color={colors.textInverse} />
        ) : (
          <Text style={[styles.shareButtonText, { color: colors.textInverse }]}>
            Share Link
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.regenerateButton, { borderColor: colors.border }]}
        onPress={handleRegenerate}
      >
        <Text style={[styles.regenerateText, { color: colors.textSecondary }]}>
          Regenerate Code
        </Text>
      </TouchableOpacity>

      <Toast
        visible={showToast}
        message={toastMessage}
        onDismiss={() => setShowToast(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  qrWrapper: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  linkLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  linkBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  linkText: {
    fontSize: 13,
    textAlign: 'center',
  },
  shareButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  regenerateButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  regenerateText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
