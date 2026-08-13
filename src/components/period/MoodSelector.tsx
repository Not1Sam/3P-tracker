import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { MOOD_OPTIONS } from '@/constants/period';
import type { Mood } from '@/types/period';

interface MoodSelectorProps {
  selected: Mood | null;
  onSelect: (mood: Mood | null) => void;
}

export function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {MOOD_OPTIONS.map((option) => {
        const isSelected = selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
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
            onPress={() => onSelect(isSelected ? null : option.value)}
            accessibilityLabel={`Mood: ${option.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={styles.emoji}>{option.emoji}</Text>
            <Text
              style={[
                styles.label,
                {
                  color: isSelected ? colors.period : colors.textSecondary,
                },
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
