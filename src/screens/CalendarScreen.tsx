import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';

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
import { useFocusEffect, useRouter } from 'expo-router';
import { getCalendarMarkedDates } from '@/services/history-service';

export function CalendarScreen() {
  const router = useRouter();
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
            { key: 'poop', color: '#8B4513' },
          ],
        };
      }

      // Mark piss dates with yellow dots
      for (const dateStr of pissDates) {
        marks[dateStr] = {
          ...(marks[dateStr] || {}),
          dots: [
            ...(marks[dateStr]?.dots || []),
            { key: 'piss', color: '#FFD700' },
          ],
        };
      }

      setMarkedDates(marks);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCalendarData(currentMonth.year, currentMonth.month);
    }, [currentMonth, loadCalendarData])
  );

  const handleDayPress = (day: { dateString: string }) => {
    router.push(`/entry/day/${day.dateString}`);
  };

  const handleMonthChange = (month: { year: number; month: number }) => {
    setCurrentMonth({ year: month.year, month: month.month });
  };

  return (
    <View style={styles.container}>
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
          todayTextColor: '#FF4500',
          arrowColor: '#FF4500',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
});
