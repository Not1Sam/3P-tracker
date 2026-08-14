import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { logger } from '@/utils/logger';
import type { CapturedLocation } from '@/types/logging';

interface LocationStatusProps {
  location: CapturedLocation | null;
  loading: boolean;
}

export function LocationStatus({ location, loading }: LocationStatusProps) {
  const colors = useThemeColors();

  if (loading) {
    logger.debug('INPUT', 'Location status: loading');
    return (
      <Text
        style={[styles.text, { color: colors.textTertiary }]}
        accessibilityLabel="Finding location"
        accessibilityRole="text"
      >
        📍 Finding location...
      </Text>
    );
  }

  if (location) {
    logger.debug('INPUT', 'Location captured', { city: location.city, hasCoords: !!(location.lat && location.lng) });
    if (location.city) {
      return (
        <Text
          style={[styles.text, { color: colors.textSecondary }]}
          accessibilityLabel={`Location: ${location.city}`}
          accessibilityRole="text"
        >
          📍 {location.city}
        </Text>
      );
    }
    return (
      <Text
        style={[styles.text, { color: colors.textSecondary }]}
        accessibilityLabel="Location saved as coordinates"
        accessibilityRole="text"
      >
        📍 Coordinates saved
      </Text>
    );
  }

  return (
    <Text
      style={[styles.text, { color: colors.textTertiary }]}
      accessibilityLabel="Location unavailable"
      accessibilityRole="text"
    >
      📍 Location unavailable
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    marginTop: 4,
  },
});
