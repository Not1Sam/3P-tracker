/**
 * NetworkContext — global provider for network connectivity state.
 * Wraps the app and exposes isConnected to all consumers via useNetwork().
 *
 * Pattern follows AuthContext.tsx: React context + provider + typed hook.
 */

import React, { createContext, useContext, type ReactNode } from 'react';
import { useNetworkState } from '@/services/network-state';

interface NetworkContextValue {
  isConnected: boolean;
  isInternetReachable: boolean;
}

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const { isConnected, isInternetReachable } = useNetworkState();

  return (
    <NetworkContext.Provider value={{ isConnected, isInternetReachable }}>
      {children}
    </NetworkContext.Provider>
  );
}

/**
 * Read network state from context. Throws if used outside <NetworkProvider>.
 */
export function useNetwork(): NetworkContextValue {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
