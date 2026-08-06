import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
} from 'react-native';
import { PISS_COLORS } from '@/constants/color-palette';
import type { CustomColor } from '@/types/logging';

interface ColorSwatchSelectorProps {
  selectedColorId: number | null;
  onSelect: (colorId: number) => void;
  onAddCustom: () => void;
  customColors?: CustomColor[];
}

export function ColorSwatchSelector({
  selectedColorId,
  onSelect,
  onAddCustom,
  customColors = [],
}: ColorSwatchSelectorProps) {
  const handleSwatchPress = (colorId: number) => {
    const color = PISS_COLORS.find((c) => c.id === colorId);
    if (color) {
      Alert.alert(color.name, color.medicalDescription);
    }
  };

  const renderSwatch = ({ item }: { item: typeof PISS_COLORS[0] }) => {
    const isSelected = selectedColorId === item.id;
    return (
      <TouchableOpacity
        style={styles.swatchContainer}
        onPress={() => onSelect(item.id)}
        onLongPress={() => handleSwatchPress(item.id)}
        accessibilityLabel={`Color: ${item.name}`}
        accessibilityRole="button"
      >
        <View
          style={[
            styles.swatch,
            { backgroundColor: item.hexValue },
            isSelected ? styles.swatchSelected : styles.swatchUnselected,
          ]}
        />
        <Text style={styles.label} numberOfLines={1}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCustomSwatch = ({ item }: { item: CustomColor }) => (
    <TouchableOpacity
      style={styles.swatchContainer}
      accessibilityLabel={`Custom color: ${item.name}`}
      accessibilityRole="button"
    >
      <View style={[styles.swatch, { backgroundColor: item.hexValue }, styles.swatchUnselected]}>
        <View style={styles.customBadge}>
          <Text style={styles.customBadgeText}>Custom</Text>
        </View>
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderAddButton = () => (
    <TouchableOpacity
      style={styles.swatchContainer}
      onPress={onAddCustom}
      accessibilityLabel="Add Custom Color"
      accessibilityRole="button"
    >
      <View style={[styles.swatch, styles.addSwatch]}>
        <Text style={styles.addIcon}>+</Text>
      </View>
      <Text style={styles.label}>Add Custom</Text>
    </TouchableOpacity>
  );

  const data = [
    ...PISS_COLORS.map((c) => ({ type: 'builtin' as const, item: c })),
    ...customColors.map((c) => ({ type: 'custom' as const, item: c })),
    { type: 'add' as const, item: null },
  ];

  return (
    <FlatList
      data={data}
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item, index) => {
        if (item.type === 'builtin') return `builtin-${(item.item as typeof PISS_COLORS[0]).id}`;
        if (item.type === 'custom') return `custom-${(item.item as CustomColor).id}`;
        return 'add';
      }}
      renderItem={({ item }) => {
        if (item.type === 'builtin') return renderSwatch(item as { item: typeof PISS_COLORS[0] });
        if (item.type === 'custom') return renderCustomSwatch(item as { item: CustomColor });
        return renderAddButton();
      }}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
  swatchContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchSelected: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: '#FF4500',
  },
  swatchUnselected: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  label: {
    fontSize: 10,
    marginTop: 4,
    color: '#666',
    textAlign: 'center',
    maxWidth: 56,
  },
  customBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  customBadgeText: {
    fontSize: 7,
    color: '#666',
    fontWeight: '600',
  },
  addSwatch: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
  },
  addIcon: {
    fontSize: 20,
    color: '#999',
  },
});
