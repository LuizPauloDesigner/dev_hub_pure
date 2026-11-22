import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default / fallback keys from Vite environment variables (if provided at build time)
const DEFAULT_URL = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const DEFAULT_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

export const getSupabaseConfig = (): SupabaseConfig => {
  const storedUrl = localStorage.getItem('supabase_project_url') || '';
  const storedKey = localStorage.getItem('supabase_anon_key') || '';

  const url = (storedUrl || DEFAULT_URL).trim();
  const anonKey = (storedKey || DEFAULT_KEY).trim();

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey && url.startsWith('http')),
  };
};

export const setSupabaseConfig = (url: string, anonKey: string): void => {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();
  localStorage.setItem('supabase_project_url', cleanUrl);
  localStorage.setItem('supabase_anon_key', cleanKey);
  _client = null; // Reset cached instance
};

export const clearSupabaseConfig = (): void => {
  localStorage.removeItem('supabase_project_url');
  localStorage.removeItem('supabase_anon_key');
  _client = null;
};

let _client: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (_client) return _client;

  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  try {
    _client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return _client;
  } catch (error) {
    console.error('[Supabase] Erro ao inicializar cliente:', error);
    return null;
  }
};
