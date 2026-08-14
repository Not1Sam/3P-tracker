import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
} from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { logger } from '@/utils/logger';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CommentFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  collapsed?: boolean;
}

export function CommentField({
  value,
  onChangeText,
  placeholder,
  collapsed = true,
}: CommentFieldProps) {
  const colors = useThemeColors();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newState = !isCollapsed;
    logger.uiAction(`CommentField: ${newState ? 'collapse' : 'expand'}`);
    setIsCollapsed(newState);
  };

  if (isCollapsed) {
    return (
      <TouchableOpacity
        style={[styles.collapsedContainer, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
        onPress={handleToggle}
        accessibilityLabel="Add a note"
        accessibilityRole="button"
      >
        <Text style={[styles.collapsedText, { color: colors.textTertiary }]}>Add a note...</Text>
        <Text style={[styles.chevron, { color: colors.textTertiary }]}>▾</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.expandedContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <TextInput
        style={[styles.textInput, { color: colors.text }]}
        value={value}
        onChangeText={(text) => { logger.uiAction('CommentField: text_input', { length: text.length }); onChangeText(text); }}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline={true}
        numberOfLines={3}
        textAlignVertical="top"
        accessibilityLabel="Comment field"
        accessibilityState={{ expanded: true }}
      />
      <TouchableOpacity
        style={styles.collapseButton}
        onPress={handleToggle}
        accessibilityLabel="Collapse comment field"
        accessibilityRole="button"
      >
        <Text style={[styles.chevron, { color: colors.textTertiary }]}>▴</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  collapsedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  collapsedText: {
    fontSize: 14,
  },
  chevron: {
    fontSize: 16,
  },
  expandedContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  textInput: {
    fontSize: 14,
    minHeight: 72,
  },
  collapseButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
});
