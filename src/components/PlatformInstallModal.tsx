import React, { useEffect, useState, useRef } from 'react';
import {
  Platform,
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Linking,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/contexts/ThemeContext';
import { logger } from '@/utils/logger';

const DISMISSAL_KEY = 'platform-install-modal-dismissed';
const GITHUB_API = 'https://api.github.com/repos/Not1Sam/3P-tracker/releases/latest';
const GITHUB_RELEASES = 'https://github.com/Not1Sam/3P-tracker/releases';
const APK_FALLBACK = 'https://github.com/Not1Sam/3P-tracker/releases/latest/download/3P-Tracker-beta_V1.1.apk';

type PlatformType = 'ios' | 'android' | 'other';

function detectPlatform(): PlatformType {
  if (Platform.OS !== 'web') return 'other';
  const ua = navigator.userAgent || '';

  // Android
  if (/android/i.test(ua)) return 'android';

  // iOS: check multiple signals since iPadOS 13+ reports as Mac
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
    ('ontouchstart' in window && /Macintosh/.test(ua) && navigator.maxTouchPoints > 1);

  if (isIOS) return 'ios';

  return 'other';
}

function isStandalone(): boolean {
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  } catch {
    return false;
  }
}

interface LatestRelease {
  tagName: string;
  apkUrl: string;
  apkName: string;
}

async function fetchLatestRelease(): Promise<LatestRelease | null> {
  try {
    const res = await fetch(GITHUB_API);
    if (!res.ok) return null;
    const data = await res.json();
    const apk = data.assets?.find(
      (a: any) => a.name?.endsWith('.apk') && a.state === 'uploaded'
    );
    if (!apk) return null;
    return {
      tagName: data.tag_name,
      apkUrl: apk.browser_download_url,
      apkName: apk.name,
    };
  } catch {
    return null;
  }
}

export function PlatformInstallModal() {
  const colors = useThemeColors();
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<PlatformType>('other');
  const [release, setRelease] = useState<LatestRelease | null>(null);
  const [loading, setLoading] = useState(false);
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    try {
      const dismissed = localStorage.getItem(DISMISSAL_KEY);
      if (dismissed === 'true') return;
    } catch {}

    if (isStandalone()) return;

    const p = detectPlatform();
    setPlatform(p);

    if (p === 'ios' || p === 'android') {
      logger.ui('Platform install modal shown', { platform: p });
      setVisible(true);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      if (p === 'android') {
        fetchLatestRelease().then(setRelease).catch(() => {});
      }
    }
  }, [scale, opacity]);

  const dismiss = () => {
    logger.uiAction('Platform install modal dismissed');
    try { localStorage.setItem(DISMISSAL_KEY, 'true'); } catch {}
    Animated.parallel([
      Animated.timing(scale, { toValue: 0.9, duration: 150, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  const handleDownloadAPK = async () => {
    setLoading(true);
    const url = release?.apkUrl ?? APK_FALLBACK;
    logger.uiAction('APK download initiated', { version: release?.tagName ?? 'latest', url });
    try {
      await Linking.openURL(url);
    } catch {
      await Linking.openURL(GITHUB_RELEASES);
    }
    setLoading(false);
    dismiss();
  };

  const handleInstallPWA = async () => {
    logger.uiAction('PWA install instructions viewed');
    dismiss();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismiss}
      accessibilityViewIsModal
    >
      <TouchableWithoutFeedback onPress={dismiss}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  transform: [{ scale }],
                  opacity,
                },
              ]}
            >
              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.surfaceVariant }]} onPress={dismiss} accessibilityLabel="Close">
                <MaterialCommunityIcons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {platform === 'ios' ? (
                <IOSContent colors={colors} onDone={handleInstallPWA} />
              ) : platform === 'android' ? (
                <AndroidContent
                  colors={colors}
                  release={release}
                  loading={loading}
                  onDownload={handleDownloadAPK}
                  onFallback={dismiss}
                />
              ) : null}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function IOSContent({ colors, onDone }: { colors: any; onDone: () => void }) {
  return (
    <View style={styles.content}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight + '20' }]}>
        <MaterialCommunityIcons name="apple" size={36} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>Get the Full Experience</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Add 3P Tracker to your Home Screen for faster access and a full-screen app feel.
      </Text>

      <View style={styles.stepsContainer}>
        <Step num={1} text='Tap the Share button in Safari' colors={colors} />
        <Step num={2} text='Scroll down and tap "Add to Home Screen"' colors={colors} />
        <Step num={3} text='Tap "Add" in the top right corner' colors={colors} />
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
        onPress={onDone}
        accessibilityRole="button"
      >
        <Text style={[styles.primaryBtnText, { color: colors.textInverse }]}>Got it</Text>
      </TouchableOpacity>
    </View>
  );
}

function Step({ num, text, colors }: { num: number; text: string; colors: any }) {
  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
        <Text style={[styles.stepNumText, { color: colors.textInverse }]}>{num}</Text>
      </View>
      <Text style={[styles.stepText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

function AndroidContent({
  colors,
  release,
  loading,
  onDownload,
  onFallback,
}: {
  colors: any;
  release: LatestRelease | null;
  loading: boolean;
  onDownload: () => void;
  onFallback: () => void;
}) {
  return (
    <View style={styles.content}>
      <View style={[styles.iconCircle, { backgroundColor: colors.accentLight + '20' }]}>
        <MaterialCommunityIcons name="android" size={36} color={colors.accent} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>Download the App</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Install 3P Tracker as a native Android app for the best experience.
      </Text>

      {release ? (
        <View style={[styles.versionBadge, { backgroundColor: colors.surfaceVariant }]}>
          <MaterialCommunityIcons name="tag-outline" size={14} color={colors.primary} />
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            Latest: {release.tagName}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: colors.accent, opacity: loading ? 0.6 : 1 }]}
        onPress={onDownload}
        disabled={loading}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color={colors.textInverse} size="small" />
        ) : (
          <>
            <MaterialCommunityIcons name="download" size={18} color={colors.textInverse} />
            <Text style={[styles.primaryBtnText, { color: colors.textInverse, marginLeft: 8 }]}>
              Download APK
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={onFallback} style={styles.textBtn}>
        <Text style={[styles.textBtnText, { color: colors.primary }]}>Or continue in browser</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  content: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  stepsContainer: {
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 14,
    flex: 1,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    minHeight: 50,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  textBtn: {
    marginTop: 16,
    padding: 8,
  },
  textBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
