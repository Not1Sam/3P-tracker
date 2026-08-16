import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect, useRouter } from 'expo-router';
import { getCalendarMarkedDates } from '@/services/history-service';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

type MarkedDateDot = {
  key: string;
  color: string;
  selectedDotColor?: string;
};

type MarkedDateValue = {
  dots?: MarkedDateDot[];
  selected?: boolean;
  marked?: boolean;
  selectedColor?: string;
};

type MarkedDates = Record<string, MarkedDateValue>;

export function CalendarScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { isAuthenticated } = useAuth();
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [currentMonth, setCurrentMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });

  const loadCalendarData = useCallback(async (year: number, month: number) => {
    try {
      const { poopDates, pissDates } = await getCalendarMarkedDates(year, month);
      const marks: MarkedDates = {};

      // Mark poop dates with brown dots
      for (const dateStr of poopDates) {
        marks[dateStr] = {
          ...(marks[dateStr] || {}),
          dots: [
            ...(marks[dateStr]?.dots || []),
            { key: 'poop', color: colors.poop },
          ],
        };
      }

      // Mark piss dates with yellow dots
      for (const dateStr of pissDates) {
        marks[dateStr] = {
          ...(marks[dateStr] || {}),
          dots: [
            ...(marks[dateStr]?.dots || []),
            { key: 'piss', color: colors.piss },
          ],
        };
      }

      setMarkedDates(marks);
    } catch (error) {
      logger.error('APP', 'Failed to load calendar data', { error });
    }
  }, [colors.poop, colors.piss]);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        setMarkedDates({});
        return;
      }
      logger.ui('Calendar screen focused');
      loadCalendarData(currentMonth.year, currentMonth.month);
    }, [currentMonth, loadCalendarData, isAuthenticated])
  );

  const handleDayPress = (day: { dateString: string }) => {
    if (!isAuthenticated) return;
    logger.ui('Calendar day pressed', { date: day.dateString });
    router.push(`/entry/day/${day.dateString}`);
  };

  const handleMonthChange = (month: { year: number; month: number }) => {
    logger.ui('Calendar month changed', { year: month.year, month: month.month });
    setCurrentMonth({ year: month.year, month: month.month });
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.emptyContainer, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="lock-outline" size={48} color={colors.textTertiary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Login required</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Log in to see your calendar history
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Calendar
        markingType="multi-dot"
        markedDates={markedDates}
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        enableSwipeMonths={true}
        theme={{
          dotStyle: {
            width: 6,
            height: 6,
            borderRadius: 3,
          },
          todayTextColor: colors.calendarAccent,
          arrowColor: colors.calendarAccent,
          backgroundColor: colors.background,
          calendarBackground: colors.background,
          textSectionTitleColor: colors.textSecondary,
          monthTextColor: colors.text,
          dayTextColor: colors.text,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
