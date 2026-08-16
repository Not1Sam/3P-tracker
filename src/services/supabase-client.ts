import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SafeStorage } from '@/utils/storage';
import { Database } from '@/db/supabase-schema';
import { logger } from '@/utils/logger';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

logger.appInit('Initializing Supabase client');

let _client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!_client) {
    if (!SUPABASE_URL) {
      throw new Error('Supabase URL not configured. Set EXPO_PUBLIC_SUPABASE_URL.');
    }
    _client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: SafeStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    logger.appInit('Supabase client initialized', { url: SUPABASE_URL ? 'configured' : 'missing' });
  }
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, _receiver) {
    return (getSupabase() as any)[prop];
  },
});
