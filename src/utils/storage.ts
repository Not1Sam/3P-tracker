import { Platform } from 'react-native';

// Web: localStorage (SecureStore not supported)
// Native: expo-secure-store
const webStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

let nativeStorage: typeof webStorage | null = null;

async function getNativeStorage() {
  if (!nativeStorage) {
    const SecureStore = await import('expo-secure-store');
    nativeStorage = {
      getItem: (key: string) => SecureStore.getItemAsync(key),
      setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
      removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    };
  }
  return nativeStorage;
}

export const SafeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') return webStorage.getItem(key);
    return (await getNativeStorage()).getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') return webStorage.setItem(key, value);
    return (await getNativeStorage()).setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') return webStorage.removeItem(key);
    return (await getNativeStorage()).removeItem(key);
  },
};
