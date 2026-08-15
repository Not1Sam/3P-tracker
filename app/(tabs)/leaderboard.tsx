import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, RefreshControl, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { getFriendsLeaderboard, getGlobalLeaderboard } from '@/services/leaderboard-service';
import { Podium } from '@/components/leaderboard/Podium';
import { LeaderboardList } from '@/components/leaderboard/LeaderboardList';
import { LeaderboardToggle } from '@/components/leaderboard/LeaderboardToggle';
import { EmptyState } from '@/components/common/EmptyState';
import { logger } from '@/utils/logger';
import type { LeaderboardEntry } from '@/services/leaderboard-service';

type ViewType = 'friends' | 'global';
type LogType = 'poop' | 'piss';

export default function LeaderboardScreen() {
  const colors = useThemeColors();
  const { isAuthenticated } = useAuth();

  const [view, setView] = useState<ViewType>('friends');
  const [logType] = useState<LogType>('poop');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    logger.navScreen('leaderboard');
  }, []);

  const fetchData = useCallback(async () => {
    try {
      logger.leaderboardAction('fetch', { view, logType });
      const data = view === 'friends'
        ? await getFriendsLeaderboard(logType)
        : await getGlobalLeaderboard(logType);
      setEntries(data);
      logger.leaderboardAction('fetchComplete', { view, logType, count: data.length });
    } catch (error) {
      logger.leaderboardAction('fetchError', { view, logType, error: String(error) });
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
    logger.uiAction('leaderboardRefresh');
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleViewChange = useCallback((newView: ViewType) => {
    logger.uiAction('leaderboardViewToggle', { from: view, to: newView });
    setView(newView);
  }, [view]);

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
            onChange={handleViewChange}
          />
        </View>

        {/* Friends view requires auth */}
        {view === 'friends' && !isAuthenticated ? (
          <EmptyState
            iconName="lock"
            iconColor={colors.textTertiary}
            title="Sign in to see friends leaderboard"
            subtitle="Compete with friends and see who's logging more!"
          />
        ) : loading && !refreshing ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : entries.length === 0 ? (
          <EmptyState
            iconName="trophy"
            iconColor={colors.primary}
            title="No data yet"
            subtitle="Start logging to see your ranking on the leaderboard!"
          />
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
