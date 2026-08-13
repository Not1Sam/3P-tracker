import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '@/components/social/Avatar';
import { useThemeColors } from '@/contexts/ThemeContext';
import type { LeaderboardEntry } from '@/services/leaderboard-service';

interface PodiumProps {
  entries: LeaderboardEntry[];
}

interface PodiumColumnProps {
  entry: LeaderboardEntry;
  rank: number;
  height: number;
  medal: string;
}

function PodiumColumn({ entry, rank, height, medal }: PodiumColumnProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.column}>
      <Text style={styles.medal}>{medal}</Text>
      <Avatar username={entry.username} size={48} />
      <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
        {entry.username}
      </Text>
      <Text style={[styles.score, { color: colors.textSecondary }]}>
        {entry.score}
      </Text>
      <View
        style={[
          styles.bar,
          {
            height,
            backgroundColor: colors.surfaceVariant,
          },
        ]}
      />
    </View>
  );
}

export function Podium({ entries }: PodiumProps) {
  // Filter out null/undefined entries
  const validEntries = entries.filter((e): e is LeaderboardEntry => e != null);

  // Pad to 3 entries
  const padded: (LeaderboardEntry | null)[] = [...validEntries];
  while (padded.length < 3) {
    padded.push(null);
  }

  const second = padded[1];
  const first = padded[0];
  const third = padded[2];

  return (
    <View style={styles.container}>
      {second && (
        <PodiumColumn entry={second} rank={2} height={120} medal="🥈" />
      )}
      {first && (
        <PodiumColumn entry={first} rank={1} height={160} medal="🥇" />
      )}
      {third && (
        <PodiumColumn entry={third} rank={3} height={100} medal="🥉" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  column: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  medal: {
    fontSize: 24,
  },
  username: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  score: {
    fontSize: 13,
    fontWeight: '600',
  },
  bar: {
    width: '100%',
    borderRadius: 8,
    marginTop: 8,
  },
});
