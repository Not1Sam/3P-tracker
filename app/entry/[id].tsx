import React, { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { EntryDetailScreen } from '@/screens/EntryDetailScreen';
import { logger } from '@/utils/logger';
import type { LogType } from '@/types/logging';

export default function EntryDetailRoute() {
  const { id, type } = useLocalSearchParams<{ id: string; type: LogType }>();

  useEffect(() => {
    if (id && type) {
      logger.navScreen(`entryDetail: ${type}:${id}`);
    }
  }, [id, type]);

  if (!id || !type) return null;

  return <EntryDetailScreen id={id} type={type} />;
}
