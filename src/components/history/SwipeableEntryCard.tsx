import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { EntryCard } from './EntryCard';
import { useThemeColors } from '@/contexts/ThemeContext';
import { hapticMedium } from '@/utils/haptics';
import type { PoopLogEntry, PissLogEntry, LogType } from '@/types/logging';

interface SwipeableEntryCardProps {
  entry: PoopLogEntry | PissLogEntry;
  type: LogType;
  onPress: () => void;
  onDelete: (id: string, type: LogType) => void;
}

export function SwipeableEntryCard({
  entry,
  type,
  onPress,
  onDelete,
}: SwipeableEntryCardProps) {
  const colors = useThemeColors();

  const renderRightActions = () => (
    <TouchableOpacity
      style={[styles.deleteButton, { backgroundColor: colors.error }]}
      onPress={() => {
        hapticMedium();
        onDelete(entry.id, type);
      }}
      accessibilityLabel="Delete entry"
      accessibilityRole="button"
      testID="delete-button"
    >
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      rightThreshold={40}
      friction={2}
    >
      <EntryCard entry={entry} type={type} onPress={onPress} />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  deleteButton: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 12,
  },
  deleteText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
