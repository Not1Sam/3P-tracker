import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BristolTypeSelector } from '@/components/logging/BristolTypeSelector';
import { ColorSwatchSelector } from '@/components/logging/ColorSwatchSelector';
import { SmellSelector } from '@/components/logging/SmellSelector';
import { CommentField } from '@/components/logging/CommentField';
import { CustomTypeDialog } from '@/components/logging/CustomTypeDialog';
import { Toast } from '@/components/common/Toast';
import { LocationStatus } from '@/components/logging/LocationStatus';
import { useThemeColors } from '@/contexts/ThemeContext';
import {
  createPoopLog,
  createPissLog,
  undoLastLog,
  captureLocation,
} from '@/services/logging-service';
import {
  getCustomTypes,
  createCustomType,
} from '@/db/repositories/custom-type-repository';
import {
  getCustomColors,
  createCustomColor,
} from '@/db/repositories/custom-type-repository';
import type {
  LogType,
  SmellLevel,
  CapturedLocation,
  CustomType,
  CustomColor,
} from '@/types/logging';

interface LoggingScreenProps {
  type: LogType;
  onClose: () => void;
  onSaved: () => void;
}

export function LoggingScreen({ type, onClose, onSaved }: LoggingScreenProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  useEffect(() => {
    logger.ui('LoggingScreen opened', { type });
    return () => {
      logger.ui('LoggingScreen closed', { type });
    };
  }, [type]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [smell, setSmell] = useState<SmellLevel | null>(null);
  const [comment, setComment] = useState('');
  const [timestamp] = useState<Date>(new Date());
  const [location, setLocation] = useState<CapturedLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [customTypes, setCustomTypes] = useState<CustomType[]>([]);
  const [customColors, setCustomColors] = useState<CustomColor[]>([]);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [undoToast, setUndoToast] = useState(false);

  // Auto-capture timestamp + location on mount
  useEffect(() => {
    let cancelled = false;

    async function loadLocation() {
      setLocationLoading(true);
      const loc = await captureLocation();
      if (!cancelled) {
        setLocation(loc);
        setLocationLoading(false);
      }
    }

    async function loadCustomTypes() {
      try {
        const types = await getCustomTypes();
        if (!cancelled) setCustomTypes(types);
      } catch {
        // ignore — custom types are optional
      }
    }

    async function loadCustomColors() {
      try {
        const colorsData = await getCustomColors();
        if (!cancelled) setCustomColors(colorsData);
      } catch {
        // ignore — custom colors are optional
      }
    }

    loadLocation();
    if (type === 'poop') {
      loadCustomTypes();
    } else {
      loadCustomColors();
    }

    return () => {
      cancelled = true;
    };
  }, [type]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
    return isToday ? `Today at ${timeStr}` : date.toLocaleString();
  };

  const handleSave = async () => {
    logger.period('Save entry attempt', { type, typeId: selectedTypeId, colorId: selectedColorId, smell });
    setSaving(true);
    try {
      let result: { id: string; error?: string };

      if (type === 'poop') {
        result = await createPoopLog({
          typeId: selectedTypeId ?? undefined,
          comment: comment || undefined,
        });
      } else {
        result = await createPissLog({
          colorId: selectedColorId ?? undefined,
          smell: smell ?? undefined,
          comment: comment || undefined,
        });
      }

      if (result.error) {
        logger.periodAction('Save entry failed', { error: result.error });
        Alert.alert('Error', `Failed to save: ${result.error}`);
        setSaving(false);
        return;
      }

      // Success — trigger haptic feedback (try/catch — haptics may not be available)
      try {
        const Haptics = await import('expo-haptics');
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } catch {
        // Haptics not available — skip silently
      }

      logger.periodAction('Save entry success', { type, id: result.id });
      setSaved(true);
      setLastSavedId(result.id);
      setToastMessage('✅ Logged!');
      setShowToast(true);
      setSaving(false);

      // Auto-dismiss toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);

      setTimeout(() => {
        onSaved();
      }, 500);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      logger.periodAction('Save entry error', { error: message });
      Alert.alert('Error', `Failed to save: ${message}`);
      setSaving(false);
    }
  };

  const handleAddCustomType = async (name: string) => {
    logger.period('Add custom type', { name });
    try {
      const newType = await createCustomType(name);
      setCustomTypes((prev) => [newType, ...prev]);
    } catch (e) {
      logger.periodAction('Add custom type failed', { error: e });
      Alert.alert('Error', 'Failed to create custom type');
    }
  };

  const handleAddCustomColor = async (name: string) => {
    logger.period('Add custom color', { name });
    // For custom colors, use a default grey hex — user can edit later
    try {
      const newColor = await createCustomColor(name, '#808080');
      setCustomColors((prev) => [newColor, ...prev]);
    } catch (e) {
      logger.periodAction('Add custom color failed', { error: e });
      Alert.alert('Error', 'Failed to create custom color');
    }
  };

  const handleUndo = useCallback(async () => {
    if (!lastSavedId) return;
    logger.period('Undo last log', { type, lastSavedId });
    const result = await undoLastLog(type, lastSavedId);
    if (result.success) {
      logger.periodAction('Undo success', { type, id: lastSavedId });
      setUndoToast(true);
      setToastMessage('Entry removed');
      setTimeout(() => {
        setUndoToast(false);
      }, 2000);
    }
    setLastSavedId(null);
  }, [lastSavedId, type]);

  const handleDismissToast = useCallback(() => {
    setShowToast(false);
  }, []);

  if (saved) {
    return (
      <View style={[styles.savedContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Toast
          visible={showToast}
          message={toastMessage}
          onUndo={handleUndo}
          onDismiss={handleDismissToast}
        />
        <Toast
          visible={undoToast}
          message={toastMessage}
          onDismiss={() => setUndoToast(false)}
        />
        <Text style={styles.savedEmoji}>✅</Text>
        <Text style={[styles.savedText, { color: colors.text }]}>Entry saved!</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Toast
        visible={showToast}
        message={toastMessage}
        onUndo={handleUndo}
        onDismiss={handleDismissToast}
      />
      <Toast
        visible={undoToast}
        message={toastMessage}
        onDismiss={() => setUndoToast(false)}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
      {/* Header row */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => { logger.nav('Logging screen back press'); onClose(); }}
          style={[styles.headerButton, { backgroundColor: colors.surfaceVariant }]}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={[styles.headerButtonText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {type === 'poop' ? 'Log Poop' : 'Log Piss'}
        </Text>
        <TouchableOpacity
          onPress={() => { logger.nav('Logging screen close'); onClose(); }}
          style={[styles.headerButton, { backgroundColor: colors.surfaceVariant }]}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <Text style={[styles.headerButtonText, { color: colors.text }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Timestamp display */}
      <TouchableOpacity
        style={styles.timestampRow}
        accessibilityLabel={`Timestamp: ${formatTime(timestamp)}`}
      >
        <Text style={styles.timestampIcon}>🕐</Text>
        <Text style={[styles.timestampText, { color: colors.textSecondary }]}>{formatTime(timestamp)}</Text>
      </TouchableOpacity>

      {/* Location display */}
      <View style={styles.locationRow}>
        <LocationStatus location={location} loading={locationLoading} />
      </View>

      {/* Type/Color selector section */}
      <View style={styles.selectorSection}>
        {type === 'poop' ? (
          <BristolTypeSelector
            selectedTypeId={selectedTypeId}
            onSelect={(id) => { logger.period('Poop type selected', { typeId: id }); setSelectedTypeId(id); }}
            onAddCustom={() => { logger.ui('Open custom type dialog'); setShowCustomDialog(true); }}
            customTypes={customTypes}
          />
        ) : (
          <ColorSwatchSelector
            selectedColorId={selectedColorId}
            onSelect={(id) => { logger.period('Piss color selected', { colorId: id }); setSelectedColorId(id); }}
            onAddCustom={() => { logger.ui('Open custom color dialog'); setShowCustomDialog(true); }}
            customColors={customColors}
          />
        )}
      </View>

      {/* Smell selector (piss only) */}
      {type === 'piss' && (
        <View style={styles.smellSection}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Smell</Text>
          <SmellSelector selected={smell} onSelect={(s) => { logger.period('Smell selected', { smell: s }); setSmell(s); }} />
        </View>
      )}

      {/* Comment field */}
      <View style={styles.commentSection}>
        <CommentField
          value={comment}
          onChangeText={(text) => { logger.input('Comment text changed'); setComment(text); }}
          placeholder={
            type === 'poop'
              ? 'Optional note about your poop...'
              : 'Optional note about your piss...'
          }
        />
      </View>

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: saving ? colors.disabled : colors.primary }]}
        onPress={handleSave}
        disabled={saving}
        accessibilityLabel="Save Entry"
        accessibilityRole="button"
      >
        {saving ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Entry</Text>
        )}
      </TouchableOpacity>

      {/* Custom type dialog */}
      <CustomTypeDialog
        visible={showCustomDialog}
        onClose={() => setShowCustomDialog(false)}
        onSave={type === 'poop' ? handleAddCustomType : handleAddCustomColor}
        title={type === 'poop' ? 'Add Custom Poop Type' : 'Add Custom Piss Color'}
      />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timestampIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  timestampText: {
    fontSize: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
  },
  locationUnavailable: {
    fontSize: 14,
  },
  selectorSection: {
    marginBottom: 20,
  },
  smellSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  commentSection: {
    marginBottom: 24,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#B0C4DE',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  savedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  savedText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
