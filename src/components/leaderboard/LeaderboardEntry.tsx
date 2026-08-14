import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '@/components/social/Avatar';
import { StreakBadge } from './StreakBadge';
import { useThemeColors } from '@/contexts/ThemeContext';
import { logger } from '@/utils/logger';
import type { LeaderboardEntry as LeaderboardEntryType } from '@/services/leaderboard-service';

interface LeaderboardEntryProps {
  entry: LeaderboardEntryType;
  rank: number;
}

export function LeaderboardEntry({ entry, rank }: LeaderboardEntryProps) {
  const colors = useThemeColors();

  logger.leaderboard(`LeaderboardEntry rendered`, { rank, username: entry.username, score: entry.score });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: entry.isCurrentUser ? colors.surfaceVariant : colors.surface,
          borderLeftColor: entry.isCurrentUser ? colors.primary : 'transparent',
        },
      ]}
    >
      <Text style={[styles.rank, { color: colors.textSecondary }]}>{rank}</Text>
      <Avatar username={entry.username} size={40} />
      <View style={styles.info}>
        <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
          {entry.username}
        </Text>
        <Text style={[styles.score, { color: colors.textSecondary }]}>
          {entry.score} logs
        </Text>
      </View>
      <StreakBadge streak={entry.streak} size="sm" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderLeftWidth: 3,
    gap: 12,
  },
  rank: {
    fontSize: 16,
    fontWeight: '600',
    width: 24,
    textAlign: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
  },
  score: {
    fontSize: 13,
  },
});
