import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getEntryById, deleteEntryWithUndo } from '@/services/history-service';
import { formatEntryTime } from '@/utils/date-helpers';
import { getBristolType } from '@/constants/bristol-chart';
import { getPissColor } from '@/constants/color-palette';
import { SMELL_OPTIONS } from '@/constants/smell-options';
import { EditEntryModal } from '@/screens/EditEntryModal';
import { Toast } from '@/components/common/Toast';
import type { PoopLogEntry, PissLogEntry, LogType } from '@/types/logging';

interface EntryDetailScreenProps {
  id: string;
  type: LogType;
}

export function EntryDetailScreen({ id, type }: EntryDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [entry, setEntry] = useState<PoopLogEntry | PissLogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [pendingUndo, setPendingUndo] = useState<(() => void) | null>(null);

  const loadEntry = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getEntryById(id, type);
      setEntry(result ?? null);
    } catch {
      setEntry(null);
    } finally {
      setLoading(false);
    }
  }, [id, type]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  const handleDelete = async () => {
    await deleteEntryWithUndo(
      id,
      type,
      (msg: string, onUndo: () => void) => {
        setToastMessage(msg);
        setPendingUndo(() => onUndo);
        setShowToast(true);
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          setShowToast(false);
          setPendingUndo(null);
        }, 3000);
      },
      () => {
        // After undo re-creates entry, navigate back
        router.back();
      },
    );
    // Navigate back after delete (undo is handled via toast)
    router.back();
  };

  const handleUndo = () => {
    if (pendingUndo) {
      pendingUndo();
      setShowToast(false);
      setPendingUndo(null);
    }
  };

  const handleDismissToast = () => {
    setShowToast(false);
    setPendingUndo(null);
  };

  const renderTypeColorSection = () => {
    if (!entry) return null;

    if (type === 'poop') {
      const poopEntry = entry as PoopLogEntry;
      const bristolType = poopEntry.typeId != null ? getBristolType(poopEntry.typeId) : null;
      return (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Type</Text>
          {bristolType ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailValue}>{bristolType.name}</Text>
              <Text style={styles.detailSubtext}>{bristolType.description}</Text>
              <Text style={styles.detailSubtext}>{bristolType.clinicalReference}</Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>No type selected</Text>
          )}
        </View>
      );
    } else {
      const pissEntry = entry as PissLogEntry;
      const pissColor = pissEntry.colorId != null ? getPissColor(pissEntry.colorId) : null;
      return (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Color</Text>
          {pissColor ? (
            <View style={styles.detailRow}>
              <View style={[styles.colorSwatch, { backgroundColor: pissColor.hexValue }]} />
              <View style={styles.colorInfo}>
                <Text style={styles.detailValue}>{pissColor.name}</Text>
                <Text style={styles.detailSubtext}>{pissColor.medicalDescription}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.placeholderText}>No color selected</Text>
          )}
        </View>
      );
    }
  };

  const renderSmellSection = () => {
    if (type !== 'piss' || !entry) return null;
    const pissEntry = entry as PissLogEntry;
    const smellOption = SMELL_OPTIONS.find((opt) => opt.value === pissEntry.smell);
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Smell</Text>
        {smellOption ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>
              {smellOption.emoji} {smellOption.label}
            </Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>No smell level set</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#FF4500" />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Entry not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Go back</Text>
        </TouchableOpacity>
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.headerButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === 'poop' ? 'Poop Entry' : 'Piss Entry'}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowEditModal(true)}
            style={styles.headerAction}
            accessibilityLabel="Edit entry"
            accessibilityRole="button"
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.headerAction}
            accessibilityLabel="Delete entry"
            accessibilityRole="button"
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Type/Color section */}
        {renderTypeColorSection()}

        {/* Smell section (piss only) */}
        {renderSmellSection()}

        {/* Timestamp */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Timestamp</Text>
          <Text style={styles.detailValue}>
            🕐 {formatEntryTime(entry.timestamp)}
          </Text>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Location</Text>
          {entry.locationCity ? (
            <View>
              <Text style={styles.detailValue}>📍 {entry.locationCity}</Text>
              {entry.locationLat != null && entry.locationLng != null && (
                <Text style={styles.detailSubtext}>
                  {entry.locationLat.toFixed(4)}, {entry.locationLng.toFixed(4)}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.placeholderText}>No location recorded</Text>
          )}
        </View>

        {/* Comment */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Comment</Text>
          {entry.comment ? (
            <Text style={styles.detailValue}>{entry.comment}</Text>
          ) : (
            <Text style={styles.placeholderText}>No comment</Text>
          )}
        </View>
      </ScrollView>

      {/* Edit modal */}
      <EditEntryModal
        visible={showEditModal}
        entry={entry}
        type={type}
        onClose={() => setShowEditModal(false)}
        onSaved={() => {
          setShowEditModal(false);
          loadEntry();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
  },
  backLink: {
    padding: 8,
  },
  backLinkText: {
    fontSize: 14,
    color: '#007AFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerAction: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
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
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  detailSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 12,
  },
  colorInfo: {
    flex: 1,
  },
});
