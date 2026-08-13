import React, { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useNetwork } from '@/contexts/NetworkContext';
import { useThemeColors } from '@/contexts/ThemeContext';

interface OfflineBannerProps {
  onRetry?: () => void;
}

export function OfflineBanner({ onRetry }: OfflineBannerProps) {
  const { isConnected } = useNetwork();
  const colors = useThemeColors();
  const translateY = useRef(new Animated.Value(-60)).current;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isConnected && !visible) {
      setVisible(true);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (isConnected && visible) {
      Animated.timing(translateY, {
        toValue: -60,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }
  }, [isConnected, visible, translateY]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: colors.warning, transform: [{ translateY }] }]}
      accessibilityLabel="Offline — data saved locally"
      accessibilityRole="text"
    >
      <Text style={[styles.text, { color: colors.text }]}>Offline — data saved locally</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
          <Text style={[styles.retryText, { color: colors.text }]}>Retry</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  retryButton: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
