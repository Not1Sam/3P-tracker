import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LoggingScreen } from '@/screens/LoggingScreen';
import { useThemeColors } from '@/contexts/ThemeContext';
import { logger } from '@/utils/logger';

export default function PoopScreen() {
  const colors = useThemeColors();
  const [showLogging, setShowLogging] = useState(false);

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
        onPress={() => {
          logger.navScreen('PoopScreen - open logging');
          setShowLogging(true);
        }}
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
