import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/contexts/ThemeContext';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md';
}

export function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
  const colors = useThemeColors();

  if (streak === 0) {
    return null;
  }

  const iconSize = size === 'sm' ? 14 : 18;
  const fontSize = size === 'sm' ? 12 : 14;

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="fire"
        size={iconSize}
        color={colors.warning}
      />
      <Text style={[styles.text, { color: colors.warning, fontSize }]}>
        {streak}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  text: {
    fontWeight: '600',
  },
});
