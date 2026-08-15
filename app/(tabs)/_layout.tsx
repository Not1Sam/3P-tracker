import { Tabs, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useThemeColors, useTheme } from '@/contexts/ThemeContext';
import { logger } from '@/utils/logger';
import { getUserGender } from '@/services/settings';

export default function TabLayout() {
  const colors = useThemeColors();
  const { mode } = useTheme();
  const [showPeriodTab, setShowPeriodTab] = useState(() => getUserGender() === 'female');

  // Re-read gender when any tab is focused (catches gender changes from ProfileSetup)
  useFocusEffect(
    useCallback(() => {
      setShowPeriodTab(getUserGender() === 'female');
    }, [])
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#7C7A8A',
        tabBarStyle: {
          // Apple Design: Translucent material — semi-transparent with subtle border
          backgroundColor: colors.surface + 'E6', // 90% opacity
          borderTopColor: colors.borderLight,
          borderTopWidth: 0.5,
          // Subtle elevation for depth
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        },
        headerStyle: {
          // Apple Design: Translucent header material
          backgroundColor: colors.surface + 'E6',
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: 0.5 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          // Apple Design: Tighter tracking for headers
          letterSpacing: -0.3,
          fontWeight: '600',
        },
      }}
      screenListeners={{
        state: (e) => {
          const route = e.data?.state?.routes?.[e.data?.state?.index];
          if (route) {
            logger.navTab(route.name);
          }
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Poop',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="emoticon-poop" size={size} color={color} />
          ),
          tabBarActiveTintColor: colors.poop,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Piss',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="toilet" size={size} color={color} />
          ),
          tabBarActiveTintColor: colors.piss,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar" size={size} color={color} />
          ),
          tabBarActiveTintColor: colors.calendarAccent,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="format-list-bulleted" size={size} color={color} />
          ),
          tabBarActiveTintColor: colors.poop,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="trophy" size={size} color={color} />
          ),
          tabBarActiveTintColor: colors.primary,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bell-ring-outline" size={size} color={color} />
          ),
          tabBarActiveTintColor: colors.accent,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
          tabBarActiveTintColor: colors.textSecondary,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
          tabBarActiveTintColor: colors.textSecondary,
        }}
      />
      <Tabs.Screen
        name="period"
        options={{
          title: 'Period',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="water" size={size} color={color} />
          ),
          tabBarActiveTintColor: colors.period,
          href: showPeriodTab ? undefined : null,
        }}
      />
    </Tabs>
  );
}
