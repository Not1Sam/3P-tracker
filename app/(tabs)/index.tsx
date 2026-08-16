import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LoggingScreen } from '@/screens/LoggingScreen';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

export default function PoopScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [showLogging, setShowLogging] = useState(false);

  const handleTapToLog = () => {
    if (!isAuthenticated) {
      logger.nav('PoopScreen - auth required');
      Alert.alert(
        'Login Required',
        'You need to log in to log entries.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log In',
            onPress: () => {
              logger.nav('PoopScreen - navigating to login');
              router.push('/profile');
            },
          },
        ],
      );
      return;
    }
    logger.navScreen('PoopScreen - open logging');
    setShowLogging(true);
  };

  if (showLogging) {
    return (
      <LoggingScreen
        type="poop"
        onClose={() => setShowLogging(false)}
        onSaved={() => setShowLogging(false)}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={[styles.tapArea, { backgroundColor: colors.poopLight }]}
        activeOpacity={0.7}
        onPress={handleTapToLog}
        accessibilityLabel="Log a poop"
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="emoticon-poop" size={64} color={colors.poop} />
        <Text style={[styles.tapText, { color: colors.text }]}>Tap to log poop</Text>
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
