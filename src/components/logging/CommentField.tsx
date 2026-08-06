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
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCollapsed(!isCollapsed);
  };

  if (isCollapsed) {
    return (
      <TouchableOpacity
        style={styles.collapsedContainer}
        onPress={handleToggle}
        accessibilityLabel="Add a note"
        accessibilityRole="button"
      >
        <Text style={styles.collapsedText}>Add a note...</Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.expandedContainer}>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
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
        <Text style={styles.chevron}>▴</Text>
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
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FAFAFA',
  },
  collapsedText: {
    color: '#999',
    fontSize: 14,
  },
  chevron: {
    color: '#999',
    fontSize: 16,
  },
  expandedContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFF',
  },
  textInput: {
    fontSize: 14,
    minHeight: 72,
    color: '#333',
  },
  collapseButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
});
