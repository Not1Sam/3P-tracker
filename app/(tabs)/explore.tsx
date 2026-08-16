import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LoggingScreen } from '@/screens/LoggingScreen';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

export default function PissScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [showLogging, setShowLogging] = useState(false);

  const handleTapToLog = () => {
    if (!isAuthenticated) {
      logger.nav('PissScreen - auth required');
      Alert.alert(
        'Login Required',
        'You need to log in to log entries.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log In',
            onPress: () => {
              logger.nav('PissScreen - navigating to login');
              router.push('/profile');
            },
          },
        ],
      );
      return;
    }
    logger.navScreen('PissScreen - open logging');
    setShowLogging(true);
  };

  if (showLogging) {
    return (
      <LoggingScreen
        type="piss"
        onClose={() => setShowLogging(false)}
        onSaved={() => setShowLogging(false)}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={[styles.tapArea, { backgroundColor: colors.pissLight }]}
        activeOpacity={0.7}
        onPress={handleTapToLog}
        accessibilityLabel="Log a piss"
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="toilet" size={64} color={colors.piss} />
        <Text style={[styles.tapText, { color: colors.text }]}>Tap to log piss</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  tapArea: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
