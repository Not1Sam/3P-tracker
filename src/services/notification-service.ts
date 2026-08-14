/**
 * Local notification service for period reminders.
 * Uses Expo Notifications with DATE triggers (D-37, D-38, D-40).
 * All scheduling is local — no push server, no network calls (D-34).
 *
 * NOTE: expo-notifications was removed from Expo Go in SDK 53+.
 * Notifications will only work in development builds or production APKs.
 */

import { AppState } from 'react-native';
import {
  getPeriodRemindersEnabled,
  getPeriodReminderTime,
} from '@/services/settings';
import { getCycleOverview } from '@/services/period-service';
import { logger } from '@/utils/logger';

let Notifications: typeof import('expo-notifications') | null = null;
let notificationsAvailable = false;

try {
  Notifications = require('expo-notifications');
  notificationsAvailable = true;
} catch {
  notificationsAvailable = false;
}

// Track timezone offset for DST/timezone drift detection (Pitfall 2)
let lastTimezoneOffset = new Date().getTimezoneOffset();

/**
 * Configure the notification handler.
 * Call once at app init.
 */
export function configureNotifications(): void {
  if (!notificationsAvailable || !Notifications) {
    logger.ui('Notifications not available, skipping configuration');
    return;
  }
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  logger.ui('Notification handler configured');
}

/**
 * Request notification permission.
 * Only call when user enables reminders (D-39).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsAvailable || !Notifications) {
    logger.ui('Notifications not available, skipping permission request');
    return false;
  }
  try {
    logger.ui('Requesting notification permission');
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';
    logger.ui('Notification permission result', { granted, status });
    return granted;
  } catch (e) {
    logger.uiError('Failed to request notification permission', { error: e instanceof Error ? e.message : 'Unknown' });
    return false;
  }
}

/**
 * Schedule period reminders for the predicted next period.
 * Two notifications per D-38:
 *   - 1 day before at 9:00 AM
 *   - Morning of at user-configured time (default 8:00 AM)
 *
 * Cancels existing period reminders before scheduling new ones (Pitfall 1).
 */
export async function schedulePeriodReminders(
  nextPeriodDate: Date,
  enabled: boolean,
): Promise<void> {
  if (!enabled || !notificationsAvailable || !Notifications) return;

  logger.period('Scheduling period reminders', { nextPeriodDate: nextPeriodDate.toISOString() });

  // Cancel existing period reminders first (Pitfall 1: rolling window)
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'period-reminder') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  const { hour: reminderHour, minute: reminderMinute } =
    getPeriodReminderTime();

  // Reminder 1: 1 day before predicted period at 9:00 AM
  const dayBefore = new Date(nextPeriodDate);
  dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore.setHours(9, 0, 0, 0);

  if (dayBefore.getTime() > Date.now()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Period predicted for tomorrow',
        body: 'Your period is expected to start tomorrow. Be prepared!',
        data: { type: 'period-reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dayBefore,
      },
    });
    logger.period('Period reminder scheduled', { trigger: '1 day before', date: dayBefore.toISOString() });
  }

  // Reminder 2: Morning of predicted period at user-configured time
  const morningOf = new Date(nextPeriodDate);
  morningOf.setHours(reminderHour, reminderMinute, 0, 0);

  if (morningOf.getTime() > Date.now()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Period expected today',
        body: 'Your period is expected to start today.',
        data: { type: 'period-reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: morningOf,
      },
    });
    logger.period('Period reminder scheduled', { trigger: 'morning of', date: morningOf.toISOString() });
  }
  logger.period('Period reminders scheduling complete');
}

/**
 * Cancel all scheduled period reminders.
 */
export async function cancelPeriodReminders(): Promise<void> {
  if (!notificationsAvailable || !Notifications) return;
  logger.period('Cancelling period reminders');
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  let cancelled = 0;
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'period-reminder') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      cancelled++;
    }
  }
  logger.period('Period reminders cancelled', { count: cancelled });
}

/**
 * Install AppState listener for rolling reschedule on foreground resume.
 * Detects timezone offset changes (DST/timezone drift — Pitfall 2).
 * Returns cleanup function.
 */
export function rescheduleOnForeground(): () => void {
  const handler = async (state: string) => {
    if (state !== 'active') return;

    const offsetNow = new Date().getTimezoneOffset();
    if (offsetNow !== lastTimezoneOffset) {
      logger.period('Timezone offset changed, rescheduling notifications', { oldOffset: lastTimezoneOffset, newOffset: offsetNow });
      lastTimezoneOffset = offsetNow;
      // Timezone changed — reschedule notifications
      await updatePeriodReminders();
    }
  };

  const sub = AppState.addEventListener('change', handler);
  logger.ui('Foreground reschedule listener installed');
  return () => sub.remove();
}

/**
 * Convenience function: read settings, get prediction, reschedule if enabled.
 * Called on app foreground resume and when user toggles reminders setting.
 */
export async function updatePeriodReminders(): Promise<void> {
  try {
    const enabled = getPeriodRemindersEnabled();
    if (!enabled) {
      logger.period('Period reminders disabled, cancelling');
      await cancelPeriodReminders();
      return;
    }

    logger.period('Updating period reminders');
    const overview = await getCycleOverview();
    if (overview.nextPeriodPrediction) {
      await schedulePeriodReminders(overview.nextPeriodPrediction, true);
    } else {
      logger.period('No period prediction available, skipping scheduling');
    }
  } catch (e) {
    logger.period('Failed to update period reminders (non-critical)', { error: e instanceof Error ? e.message : 'Unknown' });
  }
}
