import * as Haptics from 'expo-haptics';
import { logger } from '@/utils/logger';

export function hapticLight() {
  logger.debug('ANIMATION', 'Haptic: light impact');
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticMedium() {
  logger.debug('ANIMATION', 'Haptic: medium impact');
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function hapticHeavy() {
  logger.debug('ANIMATION', 'Haptic: heavy impact');
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
}

export function hapticSuccess() {
  logger.debug('ANIMATION', 'Haptic: success notification');
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function hapticError() {
  logger.debug('ANIMATION', 'Haptic: error notification');
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
