/**
 * OfflineBanner — subtle fixed-position banner at the top of the screen
 * when network is unavailable. Slides in/out using Animated.timing.
 *
 * Positioned at zIndex: 999 (below Toast at 9999). Non-interactive
 * (pointerEvents: 'none' on container) but the banner itself is tappable
 * for potential future actions.
 *
 * Follows Toast.tsx animation pattern but with faster 200ms timing.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useNetwork } from '@/contexts/NetworkContext';
import { defaultTheme } from '@/constants/theme';

const theme = defaultTheme;

export function OfflineBanner() {
  const { isConnected } = useNetwork();
  const translateY = useRef(new Animated.Value(-50)).current;
  const isVisible = useRef(false);

  useEffect(() => {
    if (!isConnected && !isVisible.current) {
      isVisible.current = true;
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (isConnected && isVisible.current) {
      isVisible.current = false;
      Animated.timing(translateY, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isConnected, translateY]);

  // Don't render anything when connected
  if (isConnected && !isVisible.current) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY }] }]}
      pointerEvents="none"
      accessibilityLabel="Offline — data saved locally"
      accessibilityRole="text"
    >
      <Text style={styles.text}>Offline — data saved locally</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.warning,
    paddingVertical: 4,
    paddingHorizontal: 12,
    zIndex: 999,
    alignItems: 'center',
  },
  text: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '400',
  },
});
