import { Tabs, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useThemeColors } from '@/contexts/ThemeContext';
import { AppHeader } from '@/components/common/AppHeader';
import { logger } from '@/utils/logger';
import { getUserGender } from '@/services/settings';

export default function TabLayout() {
  const colors = useThemeColors();
  const [showPeriodTab, setShowPeriodTab] = useState(() => getUserGender() === 'female');

  useFocusEffect(
    useCallback(() => {
      setShowPeriodTab(getUserGender() === 'female');
    }, [])
  );

  return (
    <Tabs
      screenOptions={{
        header: () => <AppHeader />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#7C7A8A',
        tabBarStyle: {
          backgroundColor: colors.surface + 'E6',
          borderTopColor: colors.borderLight,
          borderTopWidth: 0.5,
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
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
