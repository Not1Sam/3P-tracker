import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const DISMISSAL_KEY = 'pwa-install-hint-dismissed';

export function PWAInstallHint() {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem(DISMISSAL_KEY);
    if (dismissed === 'true') return;

    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (!isStandalone) {
      setVisible(true);
      // Slide in from bottom
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [translateY]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSAL_KEY, 'true');
    // Slide out
    Animated.timing(translateY, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surfaceVariant, transform: [{ translateY }] },
      ]}
      accessibilityLabel="Add to Home Screen for the full app experience"
      accessibilityRole="text"
    >
      <TouchableOpacity
        onPress={handleDismiss}
        style={styles.content}
        activeOpacity={0.8}
      >
        <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
          ⬆️ Add to Home Screen for the full app experience
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '400',
  },
});
