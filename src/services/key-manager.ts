import * as Crypto from 'expo-crypto';
import { SafeStorage } from '@/utils/storage';
import { logger } from '@/utils/logger';

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
  await SafeStorage.setItem(KEY_STORAGE_KEY, key);
}

/**
 * Retrieve the encryption key from SecureStore
 * Returns null if no key exists (first launch)
 */
async function retrieveEncryptionKey(): Promise<string | null> {
  return await SafeStorage.getItem(KEY_STORAGE_KEY);
}

/**
 * Get the encryption key for the database.
 * On first launch: generates a new 256-bit key and stores it.
 * On subsequent launches: retrieves from SecureStore.
 *
 * This is the main export - call this to get the key for database initialization.
 */
export async function getEncryptionKey(): Promise<string> {
  logger.db('Retrieving encryption key');
  const existingKey = await retrieveEncryptionKey();

  if (existingKey) {
    logger.db('Encryption key retrieved from SecureStore');
    return existingKey;
  }

  // First launch - generate and store a new key
  logger.db('No existing key found, generating new encryption key');
  const newKey = generateEncryptionKey();
  await storeEncryptionKey(newKey);
  logger.db('New encryption key generated and stored');
  return newKey;
}

/**
 * Check if an encryption key exists in SecureStore
 * Useful for determining if this is the first launch
 */
export async function hasEncryptionKey(): Promise<boolean> {
  const key = await retrieveEncryptionKey();
  const exists = key !== null;
  logger.db('Checking encryption key existence', { exists });
  return exists;
}
