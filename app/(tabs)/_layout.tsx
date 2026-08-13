import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
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
        name="period"
        options={{
          title: 'Period',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="water" size={size} color={color} />
          ),
          tabBarActiveTintColor: colors.period,
        }}
      />
    </Tabs>
  );
}
