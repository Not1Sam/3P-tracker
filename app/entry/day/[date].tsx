import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getEntriesForDate, deleteEntryWithUndo } from '@/services/history-service';
import { formatDateHeader } from '@/utils/date-helpers';
import { EntryCard } from '@/components/history/EntryCard';
import { Toast } from '@/components/common/Toast';
import { SkeletonList } from '@/components/common/Skeleton';
import { useThemeColors } from '@/contexts/ThemeContext';
import type { PoopLogEntry, PissLogEntry, LogType } from '@/types/logging';

export default function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const [poopEntries, setPoopEntries] = useState<PoopLogEntry[]>([]);
  const [pissEntries, setPissEntries] = useState<PissLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [pendingUndo, setPendingUndo] = useState<(() => void) | null>(null);

  // Parse date at noon to avoid timezone edge cases
  const dateObj = date ? new Date(date + 'T12:00:00') : new Date();

  const loadEntries = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    try {
      const result = await getEntriesForDate(dateObj);
      setPoopEntries(result.poop);
      setPissEntries(result.piss);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
    }
  }, [date, dateObj]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleEntryPress = (entry: PoopLogEntry | PissLogEntry, type: LogType) => {
    router.push(`/entry/${entry.id}?type=${type}`);
  };

  const handleDelete = (id: string, type: LogType) => {
    deleteEntryWithUndo(
      id,
      type,
      (msg, onUndo) => {
        setToastMessage(msg);
        setPendingUndo(() => onUndo);
        setToastVisible(true);
      },
      () => {
        loadEntries();
      }
    );
  };

  const handleUndo = () => {
    if (pendingUndo) {
      pendingUndo();
      setPendingUndo(null);
    }
  };

  const formattedDate = formatDateHeader(dateObj);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
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
              <Text style={[styles.sectionHeader, { color: colors.text }]}>💩 Poop</Text>
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
              <Text style={[styles.sectionHeader, { color: colors.text }]}>🚽 Piss</Text>
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
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No entries for this day</Text>
            </View>
          )}
        </ScrollView>
      )}

      <Toast
        visible={toastVisible}
        message={toastMessage}
        onUndo={handleUndo}
        onDismiss={() => setToastVisible(false)}
      />
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
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
  },
});
