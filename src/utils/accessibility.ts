import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Hook to detect if the user has enabled reduced motion.
 * Apple Design: Reduced motion doesn't mean no feedback —
 * it means a gentler, non-vestibular equivalent.
 *
 * Use this to:
 * - Replace slides/springs/parallax with short opacity cross-fades
 * - Drop elastic/overshoot animations
 * - Keep opacity/color changes that aid comprehension
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check initial value
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);

    // Subscribe to changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion
    );

    return () => subscription.remove();
  }, []);

  return reducedMotion;
}

/**
 * Get animation config based on reduced motion preference.
 * Returns spring/timing values that are safe for vestibular disorders.
 */
export function getAnimationConfig(reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      spring: { damping: 1.0, stiffness: 500, mass: 0.5 },
      timing: { duration: 100 },
      // Use opacity-only transitions for reduced motion
      useTransform: false,
    };
  }

  return {
    spring: { damping: 1.0, stiffness: 300, mass: 0.8 },
    timing: { duration: 300 },
    useTransform: true,
  };
}
