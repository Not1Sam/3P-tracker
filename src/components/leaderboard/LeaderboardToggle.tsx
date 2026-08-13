import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';

interface LeaderboardToggleProps {
  value: 'friends' | 'global';
  onChange: (value: 'friends' | 'global') => void;
}

export function LeaderboardToggle({ value, onChange }: LeaderboardToggleProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: value === 'friends' ? colors.primary : colors.surface,
          },
        ]}
        onPress={() => onChange('friends')}
      >
        <Text
          style={[
            styles.text,
            {
              color: value === 'friends' ? colors.textInverse : colors.textSecondary,
            },
          ]}
        >
          Friends
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: value === 'global' ? colors.primary : colors.surface,
          },
        ]}
        onPress={() => onChange('global')}
      >
        <Text
          style={[
            styles.text,
            {
              color: value === 'global' ? colors.textInverse : colors.textSecondary,
            },
          ]}
        >
          Global
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
