import React, { useCallback } from 'react';
import { type StyleProp, type ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { hapticLight } from '@/utils/haptics';
import { useReducedMotion } from '@/utils/accessibility';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Apple Design: Spring constants
// - Critically damped (damping: 1.0) for default UI — no overshoot, graceful
// - Under-damped (damping: 0.8) only for momentum/flick interactions
const SPRING_UI = { damping: 1.0, stiffness: 400, mass: 0.8 };
const SPRING_MOMENTUM = { damping: 0.8, stiffness: 400, mass: 0.8 };
const SPRING_REDUCED = { damping: 1.0, stiffness: 500, mass: 0.5 };

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  /** Use momentum spring for flick/gesture interactions */
  momentum?: boolean;
  /** Claymorphism: Apply clay depth shadow */
  clay?: boolean;
}

export function AnimatedCard({ children, style, onPress, momentum = false, clay = false }: AnimatedCardProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const springConfig = reducedMotion ? SPRING_REDUCED : momentum ? SPRING_MOMENTUM : SPRING_UI;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Apple Design: Feedback on pointer-down, not release
  const handlePressIn = useCallback(() => {
    if (!reducedMotion) {
      hapticLight();
      scale.value = withSpring(0.97, springConfig);
    }
  }, [scale, springConfig, reducedMotion]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, springConfig);
  }, [scale, springConfig]);

  // Claymorphism: Base style with clay depth
  const clayStyle: ViewStyle = clay ? {
    borderRadius: 24,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  } : {};

  return (
    <AnimatedPressable
      style={[clayStyle, style, animatedStyle]}
      onPressIn={onPress ? handlePressIn : undefined}
      onPressOut={onPress ? handlePressOut : undefined}
      onPress={onPress}
    >
      {children}
    </AnimatedPressable>
  );
}
