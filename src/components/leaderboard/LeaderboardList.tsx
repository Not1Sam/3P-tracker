import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { LeaderboardEntry } from './LeaderboardEntry';
import { useThemeColors } from '@/contexts/ThemeContext';
import type { LeaderboardEntry as LeaderboardEntryType } from '@/services/leaderboard-service';

interface LeaderboardListProps {
  entries: LeaderboardEntryType[];
  startRank: number;
}

export function LeaderboardList({ entries, startRank }: LeaderboardListProps) {
  const colors = useThemeColors();

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.userId}
      renderItem={({ item, index }) => (
        <LeaderboardEntry entry={item} rank={startRank + index} />
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            No data yet — start logging!
          </Text>
        </View>
      }
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
