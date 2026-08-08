import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { EntryDetailScreen } from '@/screens/EntryDetailScreen';
import type { LogType } from '@/types/logging';

export default function EntryDetailRoute() {
  const { id, type } = useLocalSearchParams<{ id: string; type: LogType }>();

  if (!id || !type) return null;

  return <EntryDetailScreen id={id} type={type} />;
}
