import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';

interface ToastProps {
  visible: boolean;
  message: string;
  onUndo?: () => void;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({
  visible,
  message,
  onUndo,
  onDismiss,
  duration = 3000,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after duration
      timerRef.current = setTimeout(() => {
        onDismiss();
      }, duration);
    } else {
      // Slide out
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, duration, onDismiss, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY }] }]}
      accessibilityLabel={message}
      accessibilityRole="alert"
    >
      <Text style={styles.message}>{message}</Text>
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
          <Text style={styles.undoText}>Undo</Text>
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
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  message: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  undoButton: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  undoText: {
    color: '#4A9EFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
