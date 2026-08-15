import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getEntryById, deleteEntryWithUndo } from '@/services/history-service';
import { formatEntryTime } from '@/utils/date-helpers';
import { getBristolType, isCustomTypeId, getCustomTypeName } from '@/constants/bristol-chart';
import { getPissColor } from '@/constants/color-palette';
import { SMELL_OPTIONS } from '@/constants/smell-options';
import { EditEntryModal } from '@/screens/EditEntryModal';
import { Toast } from '@/components/common/Toast';
import { Skeleton } from '@/components/common/Skeleton';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getCustomTypes } from '@/services/custom-type-service';
import { logger } from '@/utils/logger';
import type { PoopLogEntry, PissLogEntry, LogType } from '@/types/logging';

interface EntryDetailScreenProps {
  id: string;
  type: LogType;
}

export function EntryDetailScreen({ id, type }: EntryDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const [entry, setEntry] = useState<PoopLogEntry | PissLogEntry | null>(null);
  const [customTypes, setCustomTypes] = useState<{ id: string; name: string }[]>([]);
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
    logger.ui('Entry detail screen opened', { id, type });
    let cancelled = false;
    (async () => {
      try {
        const result = await getEntryById(id, type);
        if (!cancelled) setEntry(result ?? null);
      } catch {
        if (!cancelled) setEntry(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    if (type === 'poop') {
      getCustomTypes().then((t) => { if (!cancelled) setCustomTypes(t); }).catch(() => {});
    }
    return () => {
      cancelled = true;
      logger.ui('Entry detail screen closed', { id, type });
    };
  }, [id, type]);

  const handleDelete = async () => {
    logger.period('Delete entry', { id, type });
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
      if (poopEntry.typeId != null) {
        if (isCustomTypeId(poopEntry.typeId)) {
          const customName = getCustomTypeName(poopEntry.typeId, customTypes);
          return (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Type</Text>
              <View style={styles.detailRow}>
                <Text style={[styles.detailValue, { color: colors.text }]}>{customName}</Text>
                <Text style={[styles.detailSubtext, { color: colors.textSecondary }]}>Custom type</Text>
              </View>
            </View>
          );
        }
        const bristolType = getBristolType(poopEntry.typeId);
        return (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Type</Text>
            {bristolType ? (
              <View style={styles.detailRow}>
                <Text style={[styles.detailValue, { color: colors.text }]}>{bristolType.name}</Text>
                <Text style={[styles.detailSubtext, { color: colors.textSecondary }]}>{bristolType.description}</Text>
                <Text style={[styles.detailSubtext, { color: colors.textSecondary }]}>{bristolType.clinicalReference}</Text>
              </View>
            ) : (
              <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>No type selected</Text>
            )}
          </View>
        );
      }
      return (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Type</Text>
          <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>No type selected</Text>
        </View>
      );
    } else {
      const pissEntry = entry as PissLogEntry;
      const pissColor = pissEntry.colorId != null ? getPissColor(pissEntry.colorId) : null;
      return (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Color</Text>
          {pissColor ? (
            <View style={styles.detailRow}>
              <View style={[styles.colorSwatch, { backgroundColor: pissColor.hexValue, borderColor: colors.border }]} />
              <View style={styles.colorInfo}>
                <Text style={[styles.detailValue, { color: colors.text }]}>{pissColor.name}</Text>
                <Text style={[styles.detailSubtext, { color: colors.textSecondary }]}>{pissColor.medicalDescription}</Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>No color selected</Text>
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
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Smell</Text>
        {smellOption ? (
          <View style={styles.detailRow}>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {smellOption.emoji} {smellOption.label}
            </Text>
          </View>
        ) : (
          <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>No smell level set</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        {/* Skeleton loader for entry detail */}
        <View style={styles.skeletonHeader}>
          <Skeleton width={60} height={20} borderRadius={4} />
          <Skeleton width="40%" height={16} borderRadius={4} />
        </View>
        <View style={styles.skeletonSection}>
          <Skeleton width="30%" height={14} borderRadius={4} />
          <Skeleton width="60%" height={20} borderRadius={4} />
        </View>
        <View style={styles.skeletonSection}>
          <Skeleton width="30%" height={14} borderRadius={4} />
          <Skeleton width="80%" height={16} borderRadius={4} />
        </View>
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Entry not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={[styles.backLinkText, { color: colors.primary }]}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <Toast
        visible={showToast}
        message={toastMessage}
        onUndo={handleUndo}
        onDismiss={handleDismissToast}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => { logger.nav('Entry detail back'); router.back(); }}
          style={[styles.headerButton, { backgroundColor: colors.surfaceVariant }]}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={[styles.headerButtonText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {type === 'poop' ? 'Poop Entry' : 'Piss Entry'}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => { logger.ui('Edit entry pressed', { id }); setShowEditModal(true); }}
            style={styles.headerAction}
            accessibilityLabel="Edit entry"
            accessibilityRole="button"
          >
            <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.headerAction}
            accessibilityLabel="Delete entry"
            accessibilityRole="button"
          >
            <Text style={[styles.deleteButtonText, { color: colors.error }]}>Delete</Text>
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
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Timestamp</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {formatEntryTime(entry.timestamp)}
          </Text>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Location</Text>
          {entry.locationCity ? (
            <View>
              <Text style={[styles.detailValue, { color: colors.text }]}>{entry.locationCity}</Text>
              {entry.locationLat != null && entry.locationLng != null && (
                <Text style={[styles.detailSubtext, { color: colors.textSecondary }]}>
                  {entry.locationLat.toFixed(4)}, {entry.locationLng.toFixed(4)}
                </Text>
              )}
            </View>
          ) : (
            <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>No location recorded</Text>
          )}
        </View>

        {/* Comment */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Comment</Text>
          {entry.comment ? (
            <Text style={[styles.detailValue, { color: colors.text }]}>{entry.comment}</Text>
          ) : (
            <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>No comment</Text>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonHeader: {
    padding: 20,
    gap: 8,
  },
  skeletonSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  backLink: {
    padding: 8,
  },
  backLinkText: {
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
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
    fontWeight: '600',
  },
  deleteButtonText: {
    fontSize: 14,
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
    fontWeight: '500',
  },
  detailSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  placeholderText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  colorInfo: {
    flex: 1,
  },
});
