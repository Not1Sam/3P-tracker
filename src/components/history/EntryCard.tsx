import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBristolType, isCustomTypeId, getCustomTypeName } from '@/constants/bristol-chart';
import { getPissColor, getPissColorHex } from '@/constants/color-palette';
import { formatEntryTime } from '@/utils/date-helpers';
import { useThemeColors } from '@/contexts/ThemeContext';
import { AnimatedCard } from '@/components/common/AnimatedCard';
import { getCustomTypes } from '@/services/custom-type-service';
import { logger } from '@/utils/logger';
import type { PoopLogEntry, PissLogEntry, LogType } from '@/types/logging';

interface EntryCardProps {
  entry: PoopLogEntry | PissLogEntry;
  type: LogType;
  onPress: () => void;
}

export function EntryCard({ entry, type, onPress }: EntryCardProps) {
  const colors = useThemeColors();
  const [customTypes, setCustomTypes] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (type === 'poop') {
      getCustomTypes().then(setCustomTypes).catch(() => {});
    }
  }, [type]);

  const handlePress = () => {
    logger.inputAction('Entry card tapped', { type, entryId: entry.id });
    onPress();
  };
  const timeStr = formatEntryTime(entry.timestamp);

  const renderIndicator = () => {
    if (type === 'poop') {
      const poopEntry = entry as PoopLogEntry;
      let label = 'N/A';
      if (poopEntry.typeId != null) {
        if (isCustomTypeId(poopEntry.typeId)) {
          label = getCustomTypeName(poopEntry.typeId, customTypes);
        } else {
          const bristolType = getBristolType(poopEntry.typeId);
          label = bristolType ? `Type ${poopEntry.typeId}` : 'N/A';
        }
      }
      return (
        <View style={styles.indicatorContainer}>
          <MaterialCommunityIcons name="emoticon-poop" size={28} color={colors.poop} />
          <Text style={[styles.indicatorLabel, { color: colors.textSecondary }]}>
            {label}
          </Text>
        </View>
      );
    }

    const pissEntry = entry as PissLogEntry;
    const colorHex = pissEntry.colorId != null ? getPissColorHex(pissEntry.colorId) : colors.disabled;
    const colorObj = pissEntry.colorId != null ? getPissColor(pissEntry.colorId) : null;
    return (
      <View style={styles.indicatorContainer}>
        <View
          style={[styles.colorSwatch, { backgroundColor: colorHex, borderColor: colors.border }]}
          accessibilityLabel={`Color: ${colorObj?.name ?? 'Unknown'}`}
        />
        <Text style={[styles.indicatorLabel, { color: colors.textSecondary }]}>
          {colorObj?.name ?? 'N/A'}
        </Text>
      </View>
    );
  };

  const formatTime = () => timeStr;

  const formatLocation = () => {
    if (entry.locationCity) {
      return entry.locationCity;
    }
    return null;
  };

  const formatComment = () => {
    if (entry.comment) {
      return entry.comment;
    }
    return null;
  };

  const typeLabel = type === 'poop' ? 'Poop' : 'Piss';
  const time = formatTime();
  const city = entry.locationCity ?? '';
  const accessibilityText = `${typeLabel}, ${time}${city ? `, ${city}` : ''}`;

  return (
    <AnimatedCard
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={handlePress}
    >
      <View
        accessibilityLabel={accessibilityText}
        accessibilityRole="button"
      >
        {renderIndicator()}
        <View style={styles.content}>
          <Text style={[styles.time, { color: colors.text }]}>{formatTime()}</Text>
          {formatLocation() && (
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={13} color={colors.textSecondary} />
              <Text style={[styles.location, { color: colors.textSecondary }]}> {formatLocation()}</Text>
            </View>
          )}
          {formatComment() && (
            <Text style={[styles.comment, { color: colors.textTertiary }]} numberOfLines={1}>
              {formatComment()}
            </Text>
          )}
        </View>
      </View>
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  indicatorContainer: {
    width: 56,
    alignItems: 'center',
    marginRight: 12,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  indicatorLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  time: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  location: {
    fontSize: 13,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  comment: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
