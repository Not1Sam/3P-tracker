import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const KEY_STORAGE_KEY = 'db_encryption_key';

/**
 * Generate a random 256-bit encryption key
 * Uses expo-crypto for cryptographically secure random values
 */
function generateEncryptionKey(): string {
  const keyBytes = Crypto.getRandomValues(new Uint8Array(32));
  return Array.from(keyBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Store the encryption key in SecureStore (iOS Keychain / Android Keystore)
 */
async function storeEncryptionKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(KEY_STORAGE_KEY, key);
}

/**
 * Retrieve the encryption key from SecureStore
 * Returns null if no key exists (first launch)
 */
async function retrieveEncryptionKey(): Promise<string | null> {
  return await SecureStore.getItemAsync(KEY_STORAGE_KEY);
}

/**
 * Get the encryption key for the database.
 * On first launch: generates a new 256-bit key and stores it.
 * On subsequent launches: retrieves from SecureStore.
 *
 * This is the main export - call this to get the key for database initialization.
 */
export async function getEncryptionKey(): Promise<string> {
  const existingKey = await retrieveEncryptionKey();

  if (existingKey) {
    return existingKey;
  }

  // First launch - generate and store a new key
  const newKey = generateEncryptionKey();
  await storeEncryptionKey(newKey);
  return newKey;
}

/**
 * Check if an encryption key exists in SecureStore
 * Useful for determining if this is the first launch
 */
export async function hasEncryptionKey(): Promise<boolean> {
  const key = await retrieveEncryptionKey();
  return key !== null;
}
