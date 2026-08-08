import React, { useState, useCallback } from 'react';
import { View, Text, SectionList, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getEntriesPaginated, deleteEntryWithUndo } from '@/services/history-service';
import { groupEntriesByDate } from '@/utils/date-helpers';
import { SwipeableEntryCard } from '@/components/history/SwipeableEntryCard';
import { DateSectionHeader } from '@/components/history/DateSectionHeader';
import { Toast } from '@/components/common/Toast';
import type { PoopLogEntry, PissLogEntry, LogType } from '@/types/logging';
import type { DateSection } from '@/utils/date-helpers';

export function HistoryScreen() {
  const router = useRouter();
  const [sections, setSections] = useState<DateSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [pendingUndo, setPendingUndo] = useState<(() => void) | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const entries = await getEntriesPaginated(50, 0);
      const grouped = groupEntriesByDate(entries);
      setSections(grouped);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

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

  const renderItem = ({ item }: { item: PoopLogEntry | PissLogEntry }) => {
    // Determine type from shape — poop has typeId, piss has colorId
    const type: LogType = 'typeId' in item && item.typeId !== undefined ? 'poop' : 'piss';
    return (
      <SwipeableEntryCard
        entry={item}
        type={type}
        onPress={() => handleEntryPress(item, type)}
        onDelete={handleDelete}
      />
    );
  };

  const renderSectionHeader = ({ section }: { section: DateSection }) => (
    <DateSectionHeader title={section.title} />
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No entries yet. Start logging!</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={true}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={5}
          contentContainerStyle={styles.listContent}
        />
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  listContent: {
    padding: 16,
  },
});
