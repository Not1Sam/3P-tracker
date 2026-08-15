import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useThemeColors } from '@/contexts/ThemeContext';
import { logger } from '@/utils/logger';

interface SplashScreenProps {
  onFinish: () => void;
}

// Apple Design: Spring constants for splash
const SPRING_ENTER = { damping: 1.0, stiffness: 200, mass: 1.0 };
const SPRING_EMOJI = { damping: 0.8, stiffness: 180, mass: 1.2 };

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const colors = useThemeColors();
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const emojiScale = useSharedValue(0.5);
  const emojiOpacity = useSharedValue(0);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
    opacity: emojiOpacity.value,
  }));

  const handleFinish = useCallback(() => {
    logger.ui('SplashScreen: splash_finish');
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    // Apple Design: Staggered spring entrance
    // Emoji enters first with slight bounce (momentum feel)
    emojiScale.value = withSpring(1, SPRING_EMOJI);
    emojiOpacity.value = withTiming(1, { duration: 300 });

    // Content follows with critically damped spring
    scale.value = withDelay(100, withSpring(1, SPRING_ENTER));
    opacity.value = withDelay(100, withTiming(1, { duration: 400 }));

    const timer = setTimeout(() => {
      handleFinish();
    }, 1800);

    return () => clearTimeout(timer);
  }, [emojiOpacity, emojiScale, handleFinish, opacity, scale]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Animated.View style={emojiStyle}>
          <MaterialCommunityIcons name="emoticon-poop" size={88} color={colors.poop} />
        </Animated.View>
        <Animated.View style={[styles.textGroup, contentStyle]}>
          <Text style={[styles.title, { color: colors.text }]}>3P Tracker</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Track your business
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  textGroup: {
    alignItems: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.2,
    opacity: 0.8,
  },
});
