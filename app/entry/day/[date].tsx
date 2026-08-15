import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getEntriesForDate } from '@/services/history-service';
import { formatDateHeader } from '@/utils/date-helpers';
import { EntryCard } from '@/components/history/EntryCard';
import { SkeletonList } from '@/components/common/Skeleton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/contexts/ThemeContext';
import { logger } from '@/utils/logger';
import type { PoopLogEntry, PissLogEntry, LogType } from '@/types/logging';

export default function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const [poopEntries, setPoopEntries] = useState<PoopLogEntry[]>([]);
  const [pissEntries, setPissEntries] = useState<PissLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const dateObj = useMemo(() => date ? new Date(date + 'T12:00:00') : new Date(), [date]);

  useEffect(() => {
    logger.navScreen(`dayDetail: ${date}`);
  }, [date]);

  const loadEntries = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    try {
      const d = new Date(date + 'T12:00:00');
      logger.dbRead('entriesForDate', { date });
      const result = await getEntriesForDate(d);
      setPoopEntries(result.poop);
      setPissEntries(result.piss);
      logger.dbRead('entriesForDateComplete', { date, poop: result.poop.length, piss: result.piss.length });
    } catch (error) {
      logger.dbError('entriesForDateFailed', { date, error: String(error) });
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleEntryPress = useCallback((entry: PoopLogEntry | PissLogEntry, type: LogType) => {
    logger.uiAction('dayEntryPress', { entryId: entry.id, logType: type, date });
    router.push(`/entry/${entry.id}?type=${type}`);
  }, [date, router]);

  const handleBack = useCallback(() => {
    logger.uiAction('dayDetailBack');
    router.back();
  }, [router]);

  const formattedDate = formatDateHeader(dateObj);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.dateTitle, { color: colors.text }]}>{formattedDate}</Text>
      </View>

      {loading ? (
        <View style={styles.skeletonContainer}>
          <SkeletonList count={4} />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {poopEntries.length > 0 && (
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="emoticon-poop" size={18} color={colors.poop} />
                <Text style={[styles.sectionHeader, { color: colors.text }]}> Poop</Text>
              </View>
              {poopEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  type="poop"
                  onPress={() => handleEntryPress(entry, 'poop')}
                />
              ))}
            </View>
          )}

          {pissEntries.length > 0 && (
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="toilet" size={18} color={colors.piss} />
                <Text style={[styles.sectionHeader, { color: colors.text }]}> Piss</Text>
              </View>
              {pissEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  type="piss"
                  onPress={() => handleEntryPress(entry, 'piss')}
                />
              ))}
            </View>
          )}

          {poopEntries.length === 0 && pissEntries.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="note-text-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No entries for this day</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  backText: {
    fontSize: 16,
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  skeletonContainer: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 16,
  },
});
