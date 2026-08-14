import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FlowLevelSelector } from '@/components/period/FlowLevelSelector';
import { SymptomChecklist } from '@/components/period/SymptomChecklist';
import { MoodSelector } from '@/components/period/MoodSelector';
import { CycleOverview } from '@/components/period/CycleOverview';
import { EducationCards } from '@/components/period/EducationCards';
import {
  logPeriodEntry,
  getCycleOverview,
  getCyclePhase,
  getPeriodStats,
  getPeriodLogsForUI,
  updatePeriodEntry,
} from '@/services/period-service';
import {
  requestNotificationPermission,
  updatePeriodReminders,
  cancelPeriodReminders,
} from '@/services/notification-service';
import {
  getPeriodRemindersEnabled,
  setPeriodRemindersEnabled,
} from '@/services/settings';
import { logger } from '@/utils/logger';
import type {
  FlowLevel,
  Symptom,
  Mood,
  CycleData,
  CyclePhase,
  PeriodStats,
  PeriodLogEntry,
} from '@/types/period';

export default function PeriodScreen() {
  const colors = useThemeColors();

  // Data state
  const [cycleData, setCycleData] = useState<CycleData | null>(null);
  const [currentPhase, setCurrentPhase] = useState<CyclePhase | null>(null);
  const [stats, setStats] = useState<PeriodStats | null>(null);
  const [recentEntries, setRecentEntries] = useState<PeriodLogEntry[]>([]);
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  // Logging state
  const [lastLoggedId, setLastLoggedId] = useState<string | null>(null);
  const [flowLevel, setFlowLevel] = useState<FlowLevel | null>(null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [mood, setMood] = useState<Mood | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const loadData = useCallback(async () => {
    try {
      logger.period('PeriodScreen: loading data');
      const [overview, phase, periodStats, entries] = await Promise.all([
        getCycleOverview(),
        getCyclePhase(),
        getPeriodStats(),
        getPeriodLogsForUI(5),
      ]);
      setCycleData(overview);
      setCurrentPhase(phase);
      setStats(periodStats);
      setRecentEntries(entries);
      logger.period('PeriodScreen: data loaded', {
        hasOverview: !!overview,
        hasPhase: !!phase,
        hasStats: !!stats,
        entryCount: entries.length,
      });
    } catch (e) {
      logger.period('PeriodScreen: data load failed', { error: e });
    }
  }, []);

  useEffect(() => {
    loadData();
    setRemindersEnabled(getPeriodRemindersEnabled());
  }, [loadData]);

  const handleLogPeriod = async () => {
    logger.periodAction('Period log button pressed');
    const result = await logPeriodEntry({});
    if (result.id) {
      setLastLoggedId(result.id);
      setFlowLevel(null);
      setSymptoms([]);
      setMood(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      await loadData();
    }
  };

  const handleFlowSelect = async (level: FlowLevel | null) => {
    logger.periodAction('Flow level updated', { level });
    setFlowLevel(level);
    if (lastLoggedId) {
      await updatePeriodEntry(lastLoggedId, { flowLevel: level ?? undefined });
    }
  };

  const handleSymptomsSelect = async (selected: Symptom[]) => {
    logger.periodAction('Symptoms updated', { symptoms: selected });
    setSymptoms(selected);
    if (lastLoggedId) {
      await updatePeriodEntry(lastLoggedId, { symptoms: selected });
    }
  };

  const handleMoodSelect = async (selected: Mood | null) => {
    logger.periodAction('Mood updated', { mood: selected });
    setMood(selected);
    if (lastLoggedId) {
      await updatePeriodEntry(lastLoggedId, { mood: selected ?? undefined });
    }
  };

  const handleToggleReminders = async (value: boolean) => {
    logger.periodAction('Period reminders toggled', { enabled: value });
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        logger.period('Notification permission denied');
        return;
      }
    }
    setPeriodRemindersEnabled(value);
    setRemindersEnabled(value);
    if (value) {
      await updatePeriodReminders();
    } else {
      await cancelPeriodReminders();
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* 1. Quick Log Section */}
        <TouchableOpacity
          style={[styles.logButton, { backgroundColor: colors.period }]}
          onPress={handleLogPeriod}
          accessibilityLabel="Log period"
          accessibilityRole="button"
        >
          <Text style={styles.logButtonText}>Log Period</Text>
        </TouchableOpacity>

        {showSuccess && (
          <Text style={[styles.successText, { color: colors.period }]}>
            Logged!
          </Text>
        )}

        {/* Optional detail selectors */}
        {lastLoggedId && (
          <View style={styles.detailSection}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              Flow Level
            </Text>
            <FlowLevelSelector selected={flowLevel} onSelect={handleFlowSelect} />

            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              Symptoms
            </Text>
            <SymptomChecklist selected={symptoms} onSelect={handleSymptomsSelect} />

            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              Mood
            </Text>
            <MoodSelector selected={mood} onSelect={handleMoodSelect} />
          </View>
        )}

        {/* 2. Cycle Overview Section */}
        <View style={styles.section}>
          <CycleOverview cycleData={cycleData} />
          {currentPhase && (
            <View style={styles.phaseInfo}>
              <Text style={[styles.phaseLabel, { color: colors.period }]}>
                {currentPhase.label}
              </Text>
              <Text
                style={[styles.phaseDescription, { color: colors.textSecondary }]}
              >
                {currentPhase.description}
              </Text>
            </View>
          )}
        </View>

        {/* 3. Insights Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Insights
          </Text>
          {stats && stats.totalCycles > 0 ? (
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Average cycle length
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {Math.round(stats.averageCycleLength)} days
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Period duration
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {Math.round(stats.averagePeriodDuration)} days
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Regularity
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stats.regularity}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.emptyInsights, { color: colors.textTertiary }]}>
              Log more periods for insights
            </Text>
          )}
        </View>

        {/* 4. Education Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Learn About Your Cycle
          </Text>
          <EducationCards currentPhase={currentPhase?.name} />
          <Text style={[styles.privacyNote, { color: colors.textTertiary }]}>
            All period data stays on your device. It never leaves your phone.
          </Text>
        </View>

        {/* 5. Recent Entries Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Entries
          </Text>
          {recentEntries.length > 0 ? (
            recentEntries.map((entry, index) => (
              <View
                key={entry.id}
                style={[
                  styles.entryRow,
                  index < recentEntries.length - 1 && {
                    borderBottomColor: colors.borderLight,
                    borderBottomWidth: 1,
                  },
                ]}
              >
                <Text style={[styles.entryDate, { color: colors.text }]}>
                  {entry.timestamp.toLocaleDateString()}
                </Text>
                <Text
                  style={[styles.entryDetail, { color: colors.textSecondary }]}
                >
                  {entry.flowLevel
                    ? entry.flowLevel.charAt(0).toUpperCase() +
                      entry.flowLevel.slice(1).replace('-', ' ')
                    : 'No flow'}
                  {entry.mood ? ` · ${entry.mood}` : ''}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyEntries, { color: colors.textTertiary }]}>
              No entries yet
            </Text>
          )}
        </View>

        {/* 6. Reminders Toggle */}
        <View style={styles.reminderRow}>
          <Text style={[styles.reminderLabel, { color: colors.text }]}>
            Period Reminders
          </Text>
          <Switch
            value={remindersEnabled}
            onValueChange={handleToggleReminders}
            trackColor={{ false: colors.border, true: colors.periodLight }}
            thumbColor={remindersEnabled ? colors.period : colors.disabled}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 20,
  },
  logButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  successText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailSection: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  phaseInfo: {
    marginTop: 8,
  },
  phaseLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  phaseDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsContainer: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyInsights: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  privacyNote: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  entryDetail: {
    fontSize: 13,
  },
  emptyEntries: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  reminderLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});
