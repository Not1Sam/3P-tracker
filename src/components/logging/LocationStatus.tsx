import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
      <View style={styles.row}>
        <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textTertiary} />
        <Text style={[styles.text, { color: colors.textTertiary }]}> Finding location...</Text>
      </View>
    );
  }

  if (location) {
    logger.debug('INPUT', 'Location captured', { city: location.city, hasCoords: !!(location.lat && location.lng) });
    if (location.city) {
      return (
        <View style={styles.row}>
          <MaterialCommunityIcons name="map-marker" size={14} color={colors.textSecondary} />
          <Text style={[styles.text, { color: colors.textSecondary }]}> {location.city}</Text>
        </View>
      );
    }
    return (
      <View style={styles.row}>
        <MaterialCommunityIcons name="map-marker" size={14} color={colors.textSecondary} />
        <Text style={[styles.text, { color: colors.textSecondary }]}> Coordinates saved</Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <MaterialCommunityIcons name="map-marker-off" size={14} color={colors.textTertiary} />
      <Text style={[styles.text, { color: colors.textTertiary }]}> Location unavailable</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  text: {
    fontSize: 12,
  },
});
