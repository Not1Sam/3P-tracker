import React, { useState, useCallback } from 'react';
import { View, Text, SectionList, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getEntriesPaginated, deleteEntryWithUndo } from '@/services/history-service';
import { groupEntriesByDate } from '@/utils/date-helpers';
import { SwipeableEntryCard } from '@/components/history/SwipeableEntryCard';
import { DateSectionHeader } from '@/components/history/DateSectionHeader';
import { Toast } from '@/components/common/Toast';
import { SkeletonList } from '@/components/common/Skeleton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/contexts/ThemeContext';
import { logger } from '@/utils/logger';
import type { PoopLogEntry, PissLogEntry, LogType } from '@/types/logging';
import type { DateSection } from '@/utils/date-helpers';

export function HistoryScreen() {
  const router = useRouter();
  const colors = useThemeColors();
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
      logger.error('APP', 'Failed to load history entries', { error });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      logger.ui('History screen focused');
      loadEntries();
    }, [loadEntries])
  );

  const handleEntryPress = (entry: PoopLogEntry | PissLogEntry, type: LogType) => {
    logger.ui('History entry pressed', { id: entry.id, type });
    router.push(`/entry/${entry.id}?type=${type}`);
  };

  const handleDelete = (id: string, type: LogType) => {
    logger.period('History entry delete', { id, type });
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.skeletonContainer}>
          <SkeletonList count={6} />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="note-text-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No entries yet!</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Start logging your bathroom trips
          </Text>
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
  },
  skeletonContainer: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
});
