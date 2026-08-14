import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { logger } from '@/utils/logger';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: string;
  color?: string;
  style?: ViewStyle;
}

export function FloatingActionButton({
  onPress,
  icon = '💩',
  color,
  style,
}: FloatingActionButtonProps) {
  const colors = useThemeColors();
  const fabColor = color ?? colors.primary;

  const handlePress = () => {
    logger.uiAction('FAB pressed', { icon });
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: fabColor }, style]}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityLabel="Log entry"
      accessibilityRole="button"
    >
      <Text style={styles.icon}>{icon}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  icon: {
    fontSize: 28,
  },
});
