import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import { getDatabase } from '@/db';
import { customTypes, customColors } from '@/db/schema';
import { logger } from '@/utils/logger';
import type { CustomType, CustomColor } from '@/types/logging';

/**
 * Create a custom poop type
 */
export async function createCustomType(name: string): Promise<CustomType> {
  logger.dbWrite('custom_types', { name });
  const db = await getDatabase();
  const id = randomUUID();
  const now = new Date();

  await db.insert(customTypes).values({
    id,
    name,
    createdAt: now,
  });

  return { id, name, createdAt: now };
}

/**
 * Get all custom poop types, ordered by newest first
 */
export async function getCustomTypes(): Promise<CustomType[]> {
  logger.dbRead('custom_types');
  const db = await getDatabase();
  const rows = await db
    .select()
    .from(customTypes)
    .orderBy(desc(customTypes.createdAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
  }));
}

/**
 * Delete a custom poop type by id
 */
export async function deleteCustomType(id: string): Promise<void> {
  logger.dbWrite('custom_types', { action: 'delete', id });
  const db = await getDatabase();
  await db.delete(customTypes).where(eq(customTypes.id, id));
}

/**
 * Get all custom types (for backup export)
 */
export async function getAllCustomTypes(): Promise<any[]> {
  logger.dbRead('custom_types', { action: 'getAllForBackup' });
  const db = await getDatabase();
  return db.select().from(customTypes);
}

/**
 * Insert a custom type (for backup import)
 */
export async function insertCustomType(row: any): Promise<void> {
  logger.dbWrite('custom_types', { action: 'import' });
  const db = await getDatabase();
  await db.insert(customTypes).values(row).onConflictDoNothing();
}

/**
 * Create a custom piss color
 */
export async function createCustomColor(
  name: string,
  hexValue: string,
): Promise<CustomColor> {
  logger.dbWrite('custom_colors', { name, hexValue });
  const db = await getDatabase();
  const id = randomUUID();
  const now = new Date();

  await db.insert(customColors).values({
    id,
    name,
    hexValue,
    createdAt: now,
  });

  return { id, name, hexValue, createdAt: now };
}

/**
 * Get all custom piss colors, ordered by newest first
 */
export async function getCustomColors(): Promise<CustomColor[]> {
  logger.dbRead('custom_colors');
  const db = await getDatabase();
  const rows = await db
    .select()
    .from(customColors)
    .orderBy(desc(customColors.createdAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    hexValue: row.hexValue,
    createdAt: row.createdAt,
  }));
}

/**
 * Delete a custom piss color by id
 */
export async function deleteCustomColor(id: string): Promise<void> {
  logger.dbWrite('custom_colors', { action: 'delete', id });
  const db = await getDatabase();
  await db.delete(customColors).where(eq(customColors.id, id));
}
