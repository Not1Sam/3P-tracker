import { type ImageStyle } from 'react-native';
import { logger } from '@/utils/logger';

export interface AvatarProps {
  username: string;
  size?: number;
  style?: ImageStyle;
}

/**
 * Generate a deterministic DiceBear avatar URL from a username.
 * Uses the lorelei style — same username always produces the same avatar.
 */
export function getAvatarUrl(username: string, size: number = 64): string {
  logger.debug('APP', `Generating avatar URL for username: ${username}, size: ${size}`);
  const url = new URL('https://api.dicebear.com/10.x/lorelei/png');
  url.searchParams.set('seed', username.toLowerCase());
  url.searchParams.set('size', String(size));
  logger.debug('APP', `Avatar URL generated: ${url.href}`);
  return url.href;
}
