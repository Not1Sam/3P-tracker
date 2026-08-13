import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import type { CycleData } from '@/types/period';

interface CycleOverviewProps {
  cycleData: CycleData | null;
}

export function CycleOverview({ cycleData }: CycleOverviewProps) {
  const colors = useThemeColors();

  if (
    !cycleData ||
    cycleData.cycleStartDates.length === 0 ||
    cycleData.currentCycleDay === 0
  ) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
          Start logging to see your cycle overview
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text style={[styles.cycleDay, { color: colors.text }]}>
        Day {cycleData.currentCycleDay} of{' '}
        {Math.round(cycleData.averageCycleLength)}
      </Text>

      {cycleData.daysUntilNextPeriod !== null &&
        cycleData.nextPeriodPrediction !== null && (
          <Text style={[styles.prediction, { color: colors.period }]}>
            Next period in ~{cycleData.daysUntilNextPeriod} days
          </Text>
        )}

      {cycleData.daysUntilNextPeriod === null && (
        <Text style={[styles.prediction, { color: colors.period }]}>
          Log at least 2 periods for predictions
        </Text>
      )}

      <Text style={[styles.confidence, { color: colors.textTertiary }]}>
        {cycleData.confidence === 'high'
          ? 'Based on 6+ cycles'
          : cycleData.confidence === 'medium'
            ? 'Based on 3–5 cycles'
            : cycleData.confidence === 'low' &&
                cycleData.cycleStartDates.length >= 2
              ? 'Based on 2 cycles — accuracy improves with more data'
              : 'Log at least 2 periods for predictions'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  cycleDay: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  prediction: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  confidence: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
