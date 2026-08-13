import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { CYCLE_PHASES } from '@/constants/period';
import type { CyclePhaseName } from '@/types/period';

interface EducationCardsProps {
  currentPhase?: CyclePhaseName;
}

const PHASE_ORDER: CyclePhaseName[] = [
  'menstrual',
  'follicular',
  'ovulation',
  'luteal',
];

export function EducationCards({ currentPhase }: EducationCardsProps) {
  const colors = useThemeColors();

  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {PHASE_ORDER.map((phaseKey) => {
        const phase = CYCLE_PHASES[phaseKey];
        const isCurrent = phaseKey === currentPhase;

        return (
          <View
            key={phaseKey}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: isCurrent ? colors.period : colors.border,
                borderLeftWidth: isCurrent ? 3 : 1,
              },
            ]}
          >
            <Text style={[styles.label, { color: colors.text }]}>
              {phase.label}
            </Text>
            <Text style={[styles.dayRange, { color: colors.period }]}>
              {phase.dayRange}
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {phase.description}
            </Text>
            <View style={styles.tipsContainer}>
              {phase.tips.map((tip, i) => (
                <Text
                  key={i}
                  style={[styles.tip, { color: colors.textTertiary }]}
                >
                  • {tip}
                </Text>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: 12,
  },
  card: {
    width: 260,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  dayRange: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tipsContainer: {
    gap: 4,
  },
  tip: {
    fontSize: 13,
    lineHeight: 18,
  },
});
