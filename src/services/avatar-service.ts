import { type ImageStyle } from 'react-native';

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
  const url = new URL('https://api.dicebear.com/10.x/lorelei/png');
  url.searchParams.set('seed', username.toLowerCase());
  url.searchParams.set('size', String(size));
  return url.href;
}
