import React from 'react';
import { Text, StyleSheet } from 'react-native';
import type { CapturedLocation } from '@/types/logging';

interface LocationStatusProps {
  location: CapturedLocation | null;
  loading: boolean;
}

export function LocationStatus({ location, loading }: LocationStatusProps) {
  if (loading) {
    return (
      <Text
        style={styles.text}
        accessibilityLabel="Finding location"
        accessibilityRole="text"
      >
        📍 Finding location...
      </Text>
    );
  }

  if (location) {
    if (location.city) {
      return (
        <Text
          style={styles.text}
          accessibilityLabel={`Location: ${location.city}`}
          accessibilityRole="text"
        >
          📍 {location.city}
        </Text>
      );
    }
    return (
      <Text
        style={styles.text}
        accessibilityLabel="Location saved as coordinates"
        accessibilityRole="text"
      >
        📍 Coordinates saved
      </Text>
    );
  }

  return (
    <Text
      style={styles.unavailable}
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
    color: '#999',
    marginTop: 4,
  },
  unavailable: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
