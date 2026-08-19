import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

export function AppHeader() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface + 'E6', borderBottomColor: colors.borderLight }]}>
      {/* Status bar spacer — pushes content below the status bar */}
      <View style={{ height: insets.top }} />
      {/* Header content */}
      <View style={styles.row}>
        {/* Left icons */}
        <View style={styles.side}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              logger.nav('Header: calendar press');
              router.push('/calendar');
            }}
            accessibilityLabel="Calendar"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="calendar" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              logger.nav('Header: activity press');
              router.push('/activity');
            }}
            accessibilityLabel="Activity"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="bell-ring-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Center title */}
        <Text style={[styles.title, { color: colors.text }]}>3P Tracker</Text>

        {/* Right side */}
        <View style={styles.side}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              logger.nav('Header: settings press');
              router.push('/settings');
            }}
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="cog" size={24} color={colors.text} />
          </TouchableOpacity>
          {isAuthenticated ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                logger.nav('Header: profile press');
                router.push('/profile');
              }}
              accessibilityLabel="Profile"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="account-circle" size={24} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.loginButton, { borderColor: colors.primary }]}
              onPress={() => {
                logger.nav('Header: login press');
                router.push('/profile');
              }}
              accessibilityLabel="Login"
              accessibilityRole="button"
            >
              <Text style={[styles.loginText, { color: colors.primary }]}>Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 48,
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    borderWidth: 1.5,
  },
  loginText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
