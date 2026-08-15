import React, { useEffect, useRef } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { logger } from '@/utils/logger';
import { useThemeColors } from '@/contexts/ThemeContext';

interface ToastProps {
  visible: boolean;
  message: string;
  onUndo?: () => void;
  onDismiss: () => void;
  duration?: number;
}

// Apple Design: Spring constants for toast
const SPRING_IN = { damping: 1.0, stiffness: 300, mass: 0.8 };
const SPRING_OUT = { damping: 1.0, stiffness: 400, mass: 0.8 };

export function Toast({
  visible,
  message,
  onUndo,
  onDismiss,
  duration = 3000,
}: ToastProps) {
  const colors = useThemeColors();
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (visible) {
      logger.ui(`Toast shown: ${message}`);
      // Apple Design: Spring in — critically damped, no overshoot
      translateY.value = withSpring(0, SPRING_IN);
      opacity.value = withTiming(1, { duration: 150 });

      // Auto-dismiss after duration
      timerRef.current = setTimeout(() => {
        onDismiss();
      }, duration);
    } else {
      // Apple Design: Spring out — slightly faster for snappy feel
      translateY.value = withSpring(-120, SPRING_OUT);
      opacity.value = withTiming(0, { duration: 150 });
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, duration, onDismiss, translateY, opacity, message]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, animatedStyle, { backgroundColor: colors.text }]}
      accessibilityLabel={message}
      accessibilityRole="alert"
    >
      <Text style={[styles.message, { color: colors.textInverse }]}>{message}</Text>
      {onUndo && (
        <TouchableOpacity
          onPress={() => {
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
            onUndo();
            onDismiss();
          }}
          style={styles.undoButton}
          accessibilityLabel="Undo"
          accessibilityRole="button"
        >
          <Text style={[styles.undoText, { color: colors.primaryLight }]}>Undo</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
    elevation: 10,
    // Apple Design: Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    letterSpacing: -0.1,
  },
  undoButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  undoText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
