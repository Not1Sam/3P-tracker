import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getFriendActivity, type ActivityItem } from '@/services/activity-service';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonList } from '@/components/common/Skeleton';
import { AnimatedListItem } from '@/components/common/AnimatedList';
import { formatDistanceToNow } from 'date-fns';
import { logger } from '@/utils/logger';

export default function ActivityScreen() {
  const colors = useThemeColors();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadActivity = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      logger.sync('activityLoad', { refresh: isRefresh });
      const data = await getFriendActivity();
      setItems(data);
      logger.sync('activityLoadComplete', { count: data.length });
    } catch (error) {
      logger.error('SYNC', 'activityLoadFailed', { error: String(error) });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      logger.navScreen('activity');
      loadActivity();
    }, [loadActivity])
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SkeletonList count={5} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            logger.uiAction('activityRefresh');
            loadActivity(true);
          }} />
        }
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <EmptyState
            emoji="🎉"
            title="No activity yet"
            subtitle="Friend milestones will appear here"
          />
        }
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index} style={styles.item}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.username, { color: colors.text }]}>{item.username}</Text>
              <Text style={[styles.message, { color: colors.textSecondary }]}>{item.message}</Text>
              <Text style={[styles.time, { color: colors.textTertiary }]}>
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </Text>
            </View>
          </AnimatedListItem>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
  },
  item: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
  },
});
