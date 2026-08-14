import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SMELL_OPTIONS } from '@/constants/smell-options';
import { useThemeColors } from '@/contexts/ThemeContext';
import type { SmellLevel } from '@/types/logging';
import { logger } from '@/utils/logger';

interface SmellSelectorProps {
  selected: SmellLevel | null;
  onSelect: (smell: SmellLevel | null) => void;
}

export function SmellSelector({ selected, onSelect }: SmellSelectorProps) {
  const colors = useThemeColors();

  const handlePress = (value: SmellLevel) => {
    // Toggle behavior: tap selected pill again to deselect
    if (selected === value) {
      logger.uiAction('SmellSelector: deselect_smell', { value });
      onSelect(null);
    } else {
      logger.uiAction('SmellSelector: select_smell', { value });
      onSelect(value);
    }
  };

  return (
    <View style={styles.container}>
      {SMELL_OPTIONS.map((option) => {
        const isSelected = selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pill,
              isSelected
                ? [styles.pillSelected, { borderColor: colors.primary, backgroundColor: colors.primaryLight + '20' }]
                : [styles.pillUnselected, { borderColor: colors.border, backgroundColor: colors.surface }],
            ]}
            onPress={() => handlePress(option.value)}
            accessibilityLabel={`Smell: ${option.label}`}
            accessibilityRole="button"
          >
            <Text style={styles.emoji}>{option.emoji}</Text>
            <Text
              style={[
                styles.label,
                isSelected
                  ? [styles.labelSelected, { color: colors.text }]
                  : [styles.labelUnselected, { color: colors.textSecondary }],
              ]}
            >
              {option.label}
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
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillSelected: {
    borderWidth: 1,
  },
  pillUnselected: {
    borderWidth: 1,
  },
  emoji: {
    fontSize: 14,
    marginRight: 4,
  },
  label: {
    fontSize: 14,
  },
  labelSelected: {
    fontWeight: '600',
  },
  labelUnselected: {
    fontWeight: '400',
  },
});
