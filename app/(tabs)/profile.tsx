import React, { useEffect } from 'react';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { logger } from '@/utils/logger';

export default function ProfileTab() {
  useEffect(() => {
    logger.navScreen('profile');
  }, []);

  return <ProfileScreen />;
}
