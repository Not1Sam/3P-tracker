import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { updateEntry } from '@/services/history-service';
import { formatEntryTime } from '@/utils/date-helpers';
import { BristolTypeSelector } from '@/components/logging/BristolTypeSelector';
import { ColorSwatchSelector } from '@/components/logging/ColorSwatchSelector';
import { SmellSelector } from '@/components/logging/SmellSelector';
import { CommentField } from '@/components/logging/CommentField';
import { useThemeColors } from '@/contexts/ThemeContext';
import type { PoopLogEntry, PissLogEntry, LogType, SmellLevel } from '@/types/logging';

interface EditEntryModalProps {
  visible: boolean;
  entry: PoopLogEntry | PissLogEntry;
  type: LogType;
  onClose: () => void;
  onSaved: () => void;
}

export function EditEntryModal({
  visible,
  entry,
  type,
  onClose,
  onSaved,
}: EditEntryModalProps) {
  const colors = useThemeColors();
  // Per Pitfall 4: Initialize state from entry props
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(
    type === 'poop' ? (entry as PoopLogEntry).typeId ?? null : null,
  );
  const [selectedColorId, setSelectedColorId] = useState<number | null>(
    type === 'piss' ? (entry as PissLogEntry).colorId ?? null : null,
  );
  const [smell, setSmell] = useState<SmellLevel | null>(
    type === 'piss' ? ((entry as PissLogEntry).smell ?? null) : null,
  );
  const [comment, setComment] = useState(entry.comment ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (type === 'poop') {
        await updateEntry(entry.id, type, {
          typeId: selectedTypeId ?? undefined,
          comment: comment || undefined,
        });
      } else {
        await updateEntry(entry.id, type, {
          colorId: selectedColorId ?? undefined,
          smell: smell ?? undefined,
          comment: comment || undefined,
        });
      }
      onSaved();
    } catch {
      // Error handling could show an alert, but for simplicity just close
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomType = () => {
    // No-op for edit modal — custom types are managed from the logging screen
  };

  const handleAddCustomColor = () => {
    // No-op for edit modal — custom colors are managed from the logging screen
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Entry</Text>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.surfaceVariant }]}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          {/* Editable: Type/Color */}
          {type === 'poop' ? (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Bristol Type</Text>
              <BristolTypeSelector
                selectedTypeId={selectedTypeId}
                onSelect={setSelectedTypeId}
                onAddCustom={handleAddCustomType}
              />
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Color</Text>
              <ColorSwatchSelector
                selectedColorId={selectedColorId}
                onSelect={setSelectedColorId}
                onAddCustom={handleAddCustomColor}
              />
            </View>
          )}

          {/* Editable: Smell (piss only) */}
          {type === 'piss' && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Smell</Text>
              <SmellSelector selected={smell} onSelect={setSmell} />
            </View>
          )}

          {/* Editable: Comment */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Comment</Text>
            <CommentField
              value={comment}
              onChangeText={setComment}
              placeholder={
                type === 'poop'
                  ? 'Optional note about your poop...'
                  : 'Optional note about your piss...'
              }
              collapsed={false}
            />
          </View>

          {/* Read-only: Timestamp (D-06: locked) */}
          <View style={[styles.readOnlySection, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Timestamp</Text>
            <Text style={[styles.readOnlyText, { color: colors.textSecondary }]}>
              🕐 {formatEntryTime(entry.timestamp)}
            </Text>
            <Text style={[styles.readOnlyHint, { color: colors.textTertiary }]}>Locked — cannot be edited</Text>
          </View>

          {/* Read-only: Location (D-06: locked) */}
          <View style={[styles.readOnlySection, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Location</Text>
            {entry.locationCity ? (
              <Text style={[styles.readOnlyText, { color: colors.textSecondary }]}>📍 {entry.locationCity}</Text>
            ) : (
              <Text style={[styles.readOnlyText, { color: colors.textSecondary }]}>No location recorded</Text>
            )}
            <Text style={[styles.readOnlyHint, { color: colors.textTertiary }]}>Locked — cannot be edited</Text>
          </View>
        </ScrollView>

        {/* Save button */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: saving ? colors.disabled : colors.primary }]}
            onPress={handleSave}
            disabled={saving}
            accessibilityLabel="Save changes"
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  readOnlySection: {
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  readOnlyText: {
    fontSize: 14,
    marginBottom: 4,
  },
  readOnlyHint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
