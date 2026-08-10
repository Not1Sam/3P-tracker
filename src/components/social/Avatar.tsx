import React, { useMemo } from 'react';
import { Image, type ImageStyle } from 'react-native';
import { getAvatarUrl } from '@/services/avatar-service';

interface AvatarProps {
  username: string;
  size?: number;
  style?: ImageStyle;
}

export function Avatar({ username, size = 64, style }: AvatarProps) {
  const uri = useMemo(() => getAvatarUrl(username, size), [username, size]);

  return (
    <Image
      source={{ uri }}
      style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
    />
  );
}
