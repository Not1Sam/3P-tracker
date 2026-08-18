import { Platform } from 'react-native';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api/client';
import { logger } from '@/utils/logger';
import type { PoopLogInput, PoopLogEntry, CapturedLocation } from '@/types/logging';
import type { PissLogInput, PissLogEntry, SmellLevel } from '@/types/logging';

const IS_WEB = Platform.OS === 'web';

async function generateId(): Promise<string> {
  if (IS_WEB) {
    return crypto.randomUUID();
  }
  const { randomUUID } = await import('expo-crypto');
  return randomUUID();
}

// ── Poop Log API Adapters ──

export async function createPoopLog(
  input: PoopLogInput & { location?: CapturedLocation },
): Promise<string> {
  if (!IS_WEB) {
    const { createPoopLog: localCreate } = await import('@/db/repositories/poop-repository');
    return localCreate(input);
  }

  const id = await generateId();
  const now = new Date().toISOString();

  const res = await apiPost('/poop', {
    id,
    timestamp: now,
    typeId: input.typeId ?? null,
    comment: input.comment ?? null,
    locationLat: input.location?.lat ?? null,
    locationLng: input.location?.lng ?? null,
    locationCity: input.location?.city ?? null,
  });

  if (!res.ok) throw new Error(res.error ?? 'Failed to create poop log');
  return id;
}

export async function getPoopLogs(limit = 50): Promise<PoopLogEntry[]> {
  if (!IS_WEB) {
    const { getPoopLogs: localGet } = await import('@/db/repositories/poop-repository');
    return localGet(limit);
  }

  const res = await apiGet(`/poop?limit=${limit}`);
  if (!res.ok) return [];
  return res.data.map((r: any) => ({
    id: r.id,
    timestamp: new Date(r.timestamp),
    typeId: r.typeId,
    comment: r.comment,
    locationLat: r.locationLat,
    locationLng: r.locationLng,
    locationCity: r.locationCity,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  }));
}

export async function getPoopLogById(id: string): Promise<PoopLogEntry | undefined> {
  if (!IS_WEB) {
    const { getPoopLogById: localGet } = await import('@/db/repositories/poop-repository');
    return localGet(id);
  }

  const res = await apiGet(`/poop/${id}`);
  if (!res.ok || !res.data) return undefined;
  const r = res.data;
  return {
    id: r.id,
    timestamp: new Date(r.timestamp),
    typeId: r.typeId,
    comment: r.comment,
    locationLat: r.locationLat,
    locationLng: r.locationLng,
    locationCity: r.locationCity,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}

export async function deletePoopLog(id: string): Promise<void> {
  if (!IS_WEB) {
    const { deletePoopLog: localDelete } = await import('@/db/repositories/poop-repository');
    return localDelete(id);
  }

  await apiDelete(`/poop/${id}`);
}

export async function getPoopLogsByDateRange(start: Date, end: Date): Promise<PoopLogEntry[]> {
  if (!IS_WEB) {
    const { getPoopLogsByDateRange: localGet } = await import('@/db/repositories/poop-repository');
    return localGet(start, end);
  }

  const res = await apiGet(`/poop/range?start=${start.toISOString()}&end=${end.toISOString()}`);
  if (!res.ok) return [];
  return res.data.map((r: any) => ({
    id: r.id,
    timestamp: new Date(r.timestamp),
    typeId: r.typeId,
    comment: r.comment,
    locationLat: r.locationLat,
    locationLng: r.locationLng,
    locationCity: r.locationCity,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  }));
}

export async function getPoopLogsByDate(date: Date): Promise<PoopLogEntry[]> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return getPoopLogsByDateRange(start, end);
}

export async function getPoopLogsCount(start: Date, end: Date): Promise<number> {
  if (!IS_WEB) {
    const { getPoopLogsCount: localCount } = await import('@/db/repositories/poop-repository');
    return localCount(start, end);
  }

  const res = await apiGet(`/poop/count?start=${start.toISOString()}&end=${end.toISOString()}`);
  if (!res.ok) return 0;
  return res.data.count ?? 0;
}

export async function getPoopLogsSince(cutoff: Date): Promise<Date[]> {
  if (!IS_WEB) {
    const { getPoopLogsSince: localGet } = await import('@/db/repositories/poop-repository');
    return localGet(cutoff);
  }

  const res = await apiGet(`/poop/since?cutoff=${cutoff.toISOString()}`);
  if (!res.ok) return [];
  return res.data.map((t: string) => new Date(t));
}

export async function getAllPoopLogs(): Promise<any[]> {
  if (!IS_WEB) {
    const { getAllPoopLogs: localGet } = await import('@/db/repositories/poop-repository');
    return localGet();
  }

  const res = await apiGet('/poop?limit=9999');
  if (!res.ok) return [];
  return res.data;
}

export async function insertPoopLog(row: any): Promise<void> {
  if (!IS_WEB) {
    const { insertPoopLog: localInsert } = await import('@/db/repositories/poop-repository');
    return localInsert(row);
  }

  await apiPost('/poop', {
    id: row.id,
    timestamp: row.timestamp,
    typeId: row.typeId,
    comment: row.comment,
    locationLat: row.locationLat,
    locationLng: row.locationLng,
    locationCity: row.locationCity,
  });
}

export async function updatePoopLog(
  id: string,
  fields: { typeId?: number; comment?: string },
): Promise<void> {
  if (!IS_WEB) {
    const { updatePoopLog: localUpdate } = await import('@/db/repositories/poop-repository');
    return localUpdate(id, fields);
  }

  await apiPut(`/poop/${id}`, fields);
}

// ── Piss Log API Adapters ──

export async function createPissLog(
  input: PissLogInput & { location?: CapturedLocation },
): Promise<string> {
  if (!IS_WEB) {
    const { createPissLog: localCreate } = await import('@/db/repositories/piss-repository');
    return localCreate(input);
  }

  const id = await generateId();
  const now = new Date().toISOString();

  const res = await apiPost('/piss', {
    id,
    timestamp: now,
    colorId: input.colorId ?? null,
    smell: input.smell ?? null,
    comment: input.comment ?? null,
    locationLat: input.location?.lat ?? null,
    locationLng: input.location?.lng ?? null,
    locationCity: input.location?.city ?? null,
  });

  if (!res.ok) throw new Error(res.error ?? 'Failed to create piss log');
  return id;
}

export async function getPissLogs(limit = 50): Promise<PissLogEntry[]> {
  if (!IS_WEB) {
    const { getPissLogs: localGet } = await import('@/db/repositories/piss-repository');
    return localGet(limit);
  }

  const res = await apiGet(`/piss?limit=${limit}`);
  if (!res.ok) return [];
  return res.data.map((r: any) => ({
    id: r.id,
    timestamp: new Date(r.timestamp),
    colorId: r.colorId,
    smell: r.smell as SmellLevel | null,
    comment: r.comment,
    locationLat: r.locationLat,
    locationLng: r.locationLng,
    locationCity: r.locationCity,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  }));
}

export async function getPissLogById(id: string): Promise<PissLogEntry | undefined> {
  if (!IS_WEB) {
    const { getPissLogById: localGet } = await import('@/db/repositories/piss-repository');
    return localGet(id);
  }

  const res = await apiGet(`/piss/${id}`);
  if (!res.ok || !res.data) return undefined;
  const r = res.data;
  return {
    id: r.id,
    timestamp: new Date(r.timestamp),
    colorId: r.colorId,
    smell: r.smell as SmellLevel | null,
    comment: r.comment,
    locationLat: r.locationLat,
    locationLng: r.locationLng,
    locationCity: r.locationCity,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}

export async function deletePissLog(id: string): Promise<void> {
  if (!IS_WEB) {
    const { deletePissLog: localDelete } = await import('@/db/repositories/piss-repository');
    return localDelete(id);
  }

  await apiDelete(`/piss/${id}`);
}

export async function getPissLogsByDateRange(start: Date, end: Date): Promise<PissLogEntry[]> {
  if (!IS_WEB) {
    const { getPissLogsByDateRange: localGet } = await import('@/db/repositories/piss-repository');
    return localGet(start, end);
  }

  const res = await apiGet(`/piss/range?start=${start.toISOString()}&end=${end.toISOString()}`);
  if (!res.ok) return [];
  return res.data.map((r: any) => ({
    id: r.id,
    timestamp: new Date(r.timestamp),
    colorId: r.colorId,
    smell: r.smell as SmellLevel | null,
    comment: r.comment,
    locationLat: r.locationLat,
    locationLng: r.locationLng,
    locationCity: r.locationCity,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  }));
}

export async function getPissLogsByDate(date: Date): Promise<PissLogEntry[]> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return getPissLogsByDateRange(start, end);
}

export async function getPissLogsCount(start: Date, end: Date): Promise<number> {
  if (!IS_WEB) {
    const { getPissLogsCount: localCount } = await import('@/db/repositories/piss-repository');
    return localCount(start, end);
  }

  const res = await apiGet(`/piss/count?start=${start.toISOString()}&end=${end.toISOString()}`);
  if (!res.ok) return 0;
  return res.data.count ?? 0;
}

export async function getPissLogsSince(cutoff: Date): Promise<Date[]> {
  if (!IS_WEB) {
    const { getPissLogsSince: localGet } = await import('@/db/repositories/piss-repository');
    return localGet(cutoff);
  }

  const res = await apiGet(`/piss/since?cutoff=${cutoff.toISOString()}`);
  if (!res.ok) return [];
  return res.data.map((t: string) => new Date(t));
}

export async function getAllPissLogs(): Promise<any[]> {
  if (!IS_WEB) {
    const { getAllPissLogs: localGet } = await import('@/db/repositories/piss-repository');
    return localGet();
  }

  const res = await apiGet('/piss?limit=9999');
  if (!res.ok) return [];
  return res.data;
}

export async function insertPissLog(row: any): Promise<void> {
  if (!IS_WEB) {
    const { insertPissLog: localInsert } = await import('@/db/repositories/piss-repository');
    return localInsert(row);
  }

  await apiPost('/piss', {
    id: row.id,
    timestamp: row.timestamp,
    colorId: row.colorId,
    smell: row.smell,
    comment: row.comment,
    locationLat: row.locationLat,
    locationLng: row.locationLng,
    locationCity: row.locationCity,
  });
}

export async function updatePissLog(
  id: string,
  fields: { colorId?: number; smell?: SmellLevel; comment?: string },
): Promise<void> {
  if (!IS_WEB) {
    const { updatePissLog: localUpdate } = await import('@/db/repositories/piss-repository');
    return localUpdate(id, fields);
  }

  await apiPut(`/piss/${id}`, fields);
}

// ── Custom Types API Adapters ──

export async function getCustomTypes(): Promise<any[]> {
  if (!IS_WEB) {
    const { getCustomTypes: localGet } = await import('@/db/repositories/custom-type-repository');
    return localGet();
  }

  const res = await apiGet('/custom/types');
  if (!res.ok) return [];
  return res.data.map((r: any) => ({
    id: r.id,
    name: r.name,
    createdAt: new Date(r.createdAt),
  }));
}

export async function createCustomType(name: string): Promise<any> {
  if (!IS_WEB) {
    const { createCustomType: localCreate } = await import('@/db/repositories/custom-type-repository');
    return localCreate(name);
  }

  const id = await generateId();
  await apiPost('/custom/types', { id, name });
  return { id, name, createdAt: new Date() };
}

export async function deleteCustomType(id: string): Promise<void> {
  if (!IS_WEB) {
    const { deleteCustomType: localDelete } = await import('@/db/repositories/custom-type-repository');
    return localDelete(id);
  }

  await apiDelete(`/custom/types/${id}`);
}

export async function getAllCustomTypes(): Promise<any[]> {
  return getCustomTypes();
}

export async function insertCustomType(row: any): Promise<void> {
  if (!IS_WEB) {
    const { insertCustomType: localInsert } = await import('@/db/repositories/custom-type-repository');
    return localInsert(row);
  }

  await apiPost('/custom/types', { id: row.id, name: row.name });
}

// ── Custom Colors API Adapters ──

export async function getCustomColors(): Promise<any[]> {
  if (!IS_WEB) {
    const { getCustomColors: localGet } = await import('@/db/repositories/custom-type-repository');
    return localGet();
  }

  const res = await apiGet('/custom/colors');
  if (!res.ok) return [];
  return res.data.map((r: any) => ({
    id: r.id,
    name: r.name,
    hexValue: r.hexValue,
    createdAt: new Date(r.createdAt),
  }));
}

export async function createCustomColor(name: string, hexValue: string): Promise<any> {
  if (!IS_WEB) {
    const { createCustomColor: localCreate } = await import('@/db/repositories/custom-type-repository');
    return localCreate(name, hexValue);
  }

  const id = await generateId();
  await apiPost('/custom/colors', { id, name, hexValue });
  return { id, name, hexValue, createdAt: new Date() };
}

export async function deleteCustomColor(id: string): Promise<void> {
  if (!IS_WEB) {
    const { deleteCustomColor: localDelete } = await import('@/db/repositories/custom-type-repository');
    return localDelete(id);
  }

  await apiDelete(`/custom/colors/${id}`);
}
