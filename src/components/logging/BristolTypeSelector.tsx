import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { BRISTOL_TYPES } from '@/constants/bristol-chart';
import { useThemeColors } from '@/contexts/ThemeContext';
import type { CustomType } from '@/types/logging';

const BRISTOL_EMOJIS: Record<number, string> = {
  1: '🫘',
  2: '🥜',
  3: '🌭',
  4: '🌭',
  5: '⚪',
  6: '💧',
  7: '💧',
};

interface BristolTypeSelectorProps {
  selectedTypeId: number | null;
  onSelect: (typeId: number) => void;
  onAddCustom: () => void;
  customTypes?: CustomType[];
}

export function BristolTypeSelector({
  selectedTypeId,
  onSelect,
  onAddCustom,
  customTypes = [],
}: BristolTypeSelectorProps) {
  const colors = useThemeColors();

  const handleLongPress = (typeId: number) => {
    const type = BRISTOL_TYPES.find((t) => t.id === typeId);
    if (type) {
      Alert.alert(
        `Bristol Type ${type.id}`,
        `${type.name}\n\n${type.description}\n\nClinical Reference: ${type.clinicalReference}`,
      );
    }
  };

  return (
    <View style={styles.grid}>
      {BRISTOL_TYPES.map((type) => {
        const isSelected = selectedTypeId === type.id;
        return (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.cell,
              isSelected
                ? [styles.cellSelected, { borderColor: colors.primary, backgroundColor: colors.primaryLight + '20' }]
                : [styles.cellUnselected, { borderColor: colors.border, backgroundColor: colors.surface }],
            ]}
            onPress={() => onSelect(type.id)}
            onLongPress={() => handleLongPress(type.id)}
            accessibilityLabel={`Bristol type ${type.id}: ${type.name}`}
            accessibilityRole="button"
          >
            <Text style={styles.emoji}>{BRISTOL_EMOJIS[type.id]}</Text>
            <Text style={[styles.typeNumber, { color: colors.text }]}>Type {type.id}</Text>
            <Text style={[styles.typeName, { color: colors.textSecondary }]} numberOfLines={1}>
              {type.name}
            </Text>
          </TouchableOpacity>
        );
      })}

      {customTypes.map((custom) => {
        return (
          <TouchableOpacity
            key={custom.id}
            style={[styles.cell, styles.cellUnselected, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => {}}
            accessibilityLabel={`Custom type: ${custom.name}`}
            accessibilityRole="button"
          >
            <View style={[styles.customBadge, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.customBadgeText, { color: colors.textSecondary }]}>Custom</Text>
            </View>
            <Text style={[styles.typeName, { color: colors.textSecondary }]} numberOfLines={1}>
              {custom.name}
            </Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[styles.cell, styles.addCell, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
        onPress={onAddCustom}
        accessibilityLabel="Add Custom Type"
        accessibilityRole="button"
      >
        <Text style={[styles.addIcon, { color: colors.textTertiary }]}>+</Text>
        <Text style={[styles.addLabel, { color: colors.textTertiary }]}>Add Custom</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cellSelected: {
    borderWidth: 3,
  },
  cellUnselected: {
    borderWidth: 1,
  },
  addCell: {
    borderStyle: 'dashed',
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeName: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  customBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  addIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  addLabel: {
    fontSize: 12,
  },
});
