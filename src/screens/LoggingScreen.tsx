import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BristolTypeSelector } from '@/components/logging/BristolTypeSelector';
import { ColorSwatchSelector } from '@/components/logging/ColorSwatchSelector';
import { SmellSelector } from '@/components/logging/SmellSelector';
import { CommentField } from '@/components/logging/CommentField';
import { CustomTypeDialog } from '@/components/logging/CustomTypeDialog';
import { Toast } from '@/components/common/Toast';
import { LocationStatus } from '@/components/logging/LocationStatus';
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
        const colors = await getCustomColors();
        if (!cancelled) setCustomColors(colors);
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
      Alert.alert('Error', `Failed to save: ${message}`);
      setSaving(false);
    }
  };

  const handleAddCustomType = async (name: string) => {
    try {
      const newType = await createCustomType(name);
      setCustomTypes((prev) => [newType, ...prev]);
    } catch (e) {
      Alert.alert('Error', 'Failed to create custom type');
    }
  };

  const handleAddCustomColor = async (name: string) => {
    // For custom colors, use a default grey hex — user can edit later
    try {
      const newColor = await createCustomColor(name, '#808080');
      setCustomColors((prev) => [newColor, ...prev]);
    } catch (e) {
      Alert.alert('Error', 'Failed to create custom color');
    }
  };

  const handleUndo = useCallback(async () => {
    if (!lastSavedId) return;
    const result = await undoLastLog(type, lastSavedId);
    if (result.success) {
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
      <View style={[styles.savedContainer, { paddingTop: insets.top }]}>
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
        <Text style={styles.savedText}>Entry saved!</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
      >
      {/* Header row */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.headerButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.headerButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === 'poop' ? 'Log Poop' : 'Log Piss'}
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={styles.headerButton}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <Text style={styles.headerButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Timestamp display */}
      <TouchableOpacity
        style={styles.timestampRow}
        accessibilityLabel={`Timestamp: ${formatTime(timestamp)}`}
      >
        <Text style={styles.timestampIcon}>🕐</Text>
        <Text style={styles.timestampText}>{formatTime(timestamp)}</Text>
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
            onSelect={setSelectedTypeId}
            onAddCustom={() => setShowCustomDialog(true)}
            customTypes={customTypes}
          />
        ) : (
          <ColorSwatchSelector
            selectedColorId={selectedColorId}
            onSelect={setSelectedColorId}
            onAddCustom={() => setShowCustomDialog(true)}
            customColors={customColors}
          />
        )}
      </View>

      {/* Smell selector (piss only) */}
      {type === 'piss' && (
        <View style={styles.smellSection}>
          <Text style={styles.sectionLabel}>Smell</Text>
          <SmellSelector selected={smell} onSelect={setSmell} />
        </View>
      )}

      {/* Comment field */}
      <View style={styles.commentSection}>
        <CommentField
          value={comment}
          onChangeText={setComment}
          placeholder={
            type === 'poop'
              ? 'Optional note about your poop...'
              : 'Optional note about your piss...'
          }
        />
      </View>

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
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
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 18,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    color: '#666',
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
    color: '#666',
  },
  locationUnavailable: {
    fontSize: 14,
    color: '#999',
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
    color: '#333',
    marginBottom: 8,
  },
  commentSection: {
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#007AFF',
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
    backgroundColor: '#FFF',
  },
  savedEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  savedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});
