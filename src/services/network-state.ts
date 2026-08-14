/**
 * Network state detection hook.
 * Wraps @react-native-community/netinfo to provide isConnected and
 * isInternetReachable status. Initializes optimistically (true) until
 * NetInfo.fetch() resolves the actual state.
 *
 * Uses nullish coalescing (??) for NetInfo state fields that may be null
 * on certain platforms or during startup.
 */

import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { logger } from '@/utils/logger';

export interface NetworkState {
  /** Whether the device has any network connection (wifi, cellular, etc.) */
  isConnected: boolean;
  /** Whether the device can actually reach the internet */
  isInternetReachable: boolean;
}

/**
 * React hook that tracks network connectivity in real time.
 * Returns optimistic defaults (both true) until NetInfo resolves.
 */
export function useNetworkState(): NetworkState {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then((state) => {
      const connected = state.isConnected ?? false;
      const reachable = state.isInternetReachable ?? false;
      setIsConnected(connected);
      setIsInternetReachable(reachable);
      logger.ui('Initial network state', { connected, reachable });
    });

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      const reachable = state.isInternetReachable ?? false;
      setIsConnected(connected);
      setIsInternetReachable(reachable);
      logger.ui('Network state changed', { connected, reachable });
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, isInternetReachable };
}
