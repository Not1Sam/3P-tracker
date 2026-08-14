import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FLOW_LEVELS } from '@/constants/period';
import { logger } from '@/utils/logger';
import type { FlowLevel } from '@/types/period';

interface FlowLevelSelectorProps {
  selected: FlowLevel | null;
  onSelect: (level: FlowLevel | null) => void;
}

export function FlowLevelSelector({
  selected,
  onSelect,
}: FlowLevelSelectorProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {FLOW_LEVELS.map((level) => {
        const isSelected = selected === level.value;
        return (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.pill,
              isSelected
                ? {
                    borderColor: colors.period,
                    backgroundColor: colors.periodLight + '33',
                  }
                : {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
            ]}
            onPress={() => {
              const newValue = isSelected ? null : level.value;
              logger.periodAction('Flow level selected', { level: newValue });
              onSelect(newValue);
            }}
            accessibilityLabel={`Flow level: ${level.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={styles.emoji}>{level.emoji}</Text>
            <Text
              style={[
                styles.label,
                {
                  color: isSelected ? colors.period : colors.textSecondary,
                },
              ]}
            >
              {level.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
});
