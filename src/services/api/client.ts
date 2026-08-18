import { Platform } from 'react-native';
import { supabase } from '@/services/supabase-client';
import { logger } from '@/utils/logger';

const API_BASE = '/api';

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (Platform.OS !== 'web') return {};

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {
    // Session not available
  }
  return {};
}

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

export async function apiGet<T = any>(path: string): Promise<ApiResponse<T>> {
  if (Platform.OS !== 'web') {
    return { ok: false, status: 0, data: null, error: 'API only available on web' };
  }

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}${path}`, { headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      return { ok: false, status: res.status, data: null, error: body.error ?? 'Request failed' };
    }
    const data = await res.json();
    return { ok: true, status: res.status, data, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    logger.apiError('GET', path, msg);
    return { ok: false, status: 0, data: null, error: msg };
  }
}

export async function apiPost<T = any>(path: string, body: any): Promise<ApiResponse<T>> {
  if (Platform.OS !== 'web') {
    return { ok: false, status: 0, data: null, error: 'API only available on web' };
  }

  try {
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const resp = await res.json().catch(() => ({ error: res.statusText }));
      return { ok: false, status: res.status, data: null, error: resp.error ?? 'Request failed' };
    }
    const data = await res.json();
    return { ok: true, status: res.status, data, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    logger.apiError('POST', path, msg);
    return { ok: false, status: 0, data: null, error: msg };
  }
}

export async function apiPut<T = any>(path: string, body?: any): Promise<ApiResponse<T>> {
  if (Platform.OS !== 'web') {
    return { ok: false, status: 0, data: null, error: 'API only available on web' };
  }

  try {
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const resp = await res.json().catch(() => ({ error: res.statusText }));
      return { ok: false, status: res.status, data: null, error: resp.error ?? 'Request failed' };
    }
    const data = await res.json();
    return { ok: true, status: res.status, data, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    logger.apiError('PUT', path, msg);
    return { ok: false, status: 0, data: null, error: msg };
  }
}

export async function apiDelete<T = any>(path: string): Promise<ApiResponse<T>> {
  if (Platform.OS !== 'web') {
    return { ok: false, status: 0, data: null, error: 'API only available on web' };
  }

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers });
    if (!res.ok) {
      const resp = await res.json().catch(() => ({ error: res.statusText }));
      return { ok: false, status: res.status, data: null, error: resp.error ?? 'Request failed' };
    }
    const data = await res.json();
    return { ok: true, status: res.status, data, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    logger.apiError('DELETE', path, msg);
    return { ok: false, status: 0, data: null, error: msg };
  }
}
