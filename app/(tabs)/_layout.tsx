import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#8B4513',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Poop',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="emoticon-poop" size={size} color={color} />
          ),
          tabBarActiveTintColor: '#8B4513',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Piss',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="toilet" size={size} color={color} />
          ),
          tabBarActiveTintColor: '#FFD700',
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar" size={size} color={color} />
          ),
          tabBarActiveTintColor: '#FF4500',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="format-list-bulleted" size={size} color={color} />
          ),
          tabBarActiveTintColor: '#8B4513',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
          tabBarActiveTintColor: '#666',
        }}
      />
    </Tabs>
  );
}
