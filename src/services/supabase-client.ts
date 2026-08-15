import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { SafeStorage } from '@/utils/storage';
import { Database } from '@/db/supabase-schema';
import { logger } from '@/utils/logger';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

logger.appInit('Initializing Supabase client');

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SafeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

logger.appInit('Supabase client initialized', { url: SUPABASE_URL ? 'configured' : 'missing' });
