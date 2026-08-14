import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SYMPTOM_OPTIONS } from '@/constants/period';
import { logger } from '@/utils/logger';
import type { Symptom } from '@/types/period';

interface SymptomChecklistProps {
  selected: Symptom[];
  onSelect: (symptoms: Symptom[]) => void;
}

export function SymptomChecklist({
  selected,
  onSelect,
}: SymptomChecklistProps) {
  const colors = useThemeColors();

  const toggleSymptom = (symptom: Symptom) => {
    const isRemoving = selected.includes(symptom);
    logger.periodAction('Symptom toggled', { symptom, action: isRemoving ? 'deselected' : 'selected' });
    if (isRemoving) {
      onSelect(selected.filter((s) => s !== symptom));
    } else {
      onSelect([...selected, symptom]);
    }
  };

  return (
    <View style={styles.container}>
      {SYMPTOM_OPTIONS.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.button,
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
            onPress={() => toggleSymptom(option.value)}
            accessibilityLabel={`Symptom: ${option.label}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
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
  button: {
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
