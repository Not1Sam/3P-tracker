import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getEntriesForDate, deleteEntryWithUndo } from '@/services/history-service';
import { formatDateHeader } from '@/utils/date-helpers';
import { EntryCard } from '@/components/history/EntryCard';
import { Toast } from '@/components/common/Toast';
import type { PoopLogEntry, PissLogEntry, LogType } from '@/types/logging';

export default function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.dateTitle}>{formattedDate}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <ScrollView style={styles.content}>
          {poopEntries.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>💩 Poop</Text>
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
              <Text style={styles.sectionHeader}>🚽 Piss</Text>
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
              <Text style={styles.emptyText}>No entries for this day</Text>
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
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 16,
  },
  backText: {
    fontSize: 16,
    color: '#FF4500',
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#333',
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
