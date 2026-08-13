import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, RefreshControl, StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { getFriendsLeaderboard, getGlobalLeaderboard } from '@/services/leaderboard-service';
import { Podium } from '@/components/leaderboard/Podium';
import { LeaderboardList } from '@/components/leaderboard/LeaderboardList';
import { LeaderboardToggle } from '@/components/leaderboard/LeaderboardToggle';
import type { LeaderboardEntry } from '@/services/leaderboard-service';

type ViewType = 'friends' | 'global';
type LogType = 'poop' | 'piss';

export default function LeaderboardScreen() {
  const colors = useThemeColors();
  const { isAuthenticated } = useAuth();

  const [view, setView] = useState<ViewType>('friends');
  const [logType, setLogType] = useState<LogType>('poop');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = view === 'friends'
        ? await getFriendsLeaderboard(logType)
        : await getGlobalLeaderboard(logType);
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [view, logType]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.title, { color: colors.text }]}>Leaderboard</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{currentMonth}</Text>

        {/* Log type toggle */}
        <View style={styles.toggleRow}>
          <LeaderboardToggle
            value={view}
            onChange={setView}
          />
        </View>

        {/* Friends view requires auth */}
        {view === 'friends' && !isAuthenticated ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Sign in to see friends leaderboard
            </Text>
          </View>
        ) : loading && !refreshing ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Loading...
            </Text>
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No data yet — start logging!
            </Text>
          </View>
        ) : (
          <>
            <Podium entries={entries.slice(0, 3)} />
            <LeaderboardList entries={entries.slice(3)} startRank={4} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  toggleRow: {
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
