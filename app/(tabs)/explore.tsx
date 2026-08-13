import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FloatingActionButton } from '@/components/common/FloatingActionButton';
import { BottomSheet } from '@/components/common/BottomSheet';
import { LoggingScreen } from '@/screens/LoggingScreen';
import { useThemeColors } from '@/contexts/ThemeContext';
import type { LogType } from '@/types/logging';

export default function PissScreen() {
  const colors = useThemeColors();
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showLogging, setShowLogging] = useState(false);
  const [selectedType, setSelectedType] = useState<LogType | null>(null);

  const handleFabPress = () => {
    setShowBottomSheet(true);
  };

  const handleSelectType = (type: LogType) => {
    setSelectedType(type);
    setShowBottomSheet(false);
    setShowLogging(true);
  };

  const handleLoggingClose = () => {
    setShowLogging(false);
    setSelectedType(null);
  };

  const handleLoggingSaved = () => {
    setShowLogging(false);
    setSelectedType(null);
  };

  if (showLogging && selectedType) {
    return (
      <LoggingScreen
        type={selectedType}
        onClose={handleLoggingClose}
        onSaved={handleLoggingSaved}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.emoji}>🚽</Text>
      <Text style={[styles.text, { color: colors.textSecondary }]}>Tap 🚽 to log</Text>

      <FloatingActionButton onPress={handleFabPress} />

      <BottomSheet
        visible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        title="What are you logging?"
      >
        <View style={styles.sheetContent}>
          <TouchableOpacity
            style={[styles.typeButton, { backgroundColor: colors.poopLight, borderColor: colors.poop }]}
            onPress={() => handleSelectType('poop')}
            accessibilityLabel="Log Poop"
            accessibilityRole="button"
          >
            <Text style={styles.typeEmoji}>💩</Text>
            <Text style={[styles.typeLabel, { color: colors.text }]}>Poop</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, { backgroundColor: colors.pissLight, borderColor: colors.piss }]}
            onPress={() => handleSelectType('piss')}
            accessibilityLabel="Log Piss"
            accessibilityRole="button"
          >
            <Text style={styles.typeEmoji}>🚽</Text>
            <Text style={[styles.typeLabel, { color: colors.text }]}>Piss</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  text: {
    fontSize: 18,
  },
  sheetContent: {
    flexDirection: 'row',
    gap: 16,
  },
  typeButton: {
    flex: 1,
    height: 100,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  typeEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
