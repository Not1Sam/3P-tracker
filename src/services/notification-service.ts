/**
 * Local notification service for period reminders.
 * Uses Expo Notifications with DATE triggers (D-37, D-38, D-40).
 * All scheduling is local — no push server, no network calls (D-34).
 */

import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';
import {
  getPeriodRemindersEnabled,
  getPeriodReminderTime,
} from '@/services/settings';
import { getCycleOverview } from '@/services/period-service';

// Track timezone offset for DST/timezone drift detection (Pitfall 2)
let lastTimezoneOffset = new Date().getTimezoneOffset();

/**
 * Configure the notification handler.
 * Call once at app init.
 */
export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Request notification permission.
 * Only call when user enables reminders (D-39).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
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
  if (!enabled) return;

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
  }
}

/**
 * Cancel all scheduled period reminders.
 */
export async function cancelPeriodReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'period-reminder') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
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
      lastTimezoneOffset = offsetNow;
      // Timezone changed — reschedule notifications
      await updatePeriodReminders();
    }
  };

  const sub = AppState.addEventListener('change', handler);
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
      await cancelPeriodReminders();
      return;
    }

    const overview = await getCycleOverview();
    if (overview.nextPeriodPrediction) {
      await schedulePeriodReminders(overview.nextPeriodPrediction, true);
    }
  } catch {
    // Silently fail — notifications are non-critical
  }
}
