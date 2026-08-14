import { useEffect } from 'react';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { logger } from '@/utils/logger';

export default function HistoryTab() {
  useEffect(() => {
    logger.navScreen('history');
  }, []);

  return <HistoryScreen />;
}
