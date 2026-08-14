import { useEffect } from 'react';
import { CalendarScreen } from '@/screens/CalendarScreen';
import { logger } from '@/utils/logger';

export default function CalendarTab() {
  useEffect(() => {
    logger.navScreen('calendar');
  }, []);

  return <CalendarScreen />;
}
