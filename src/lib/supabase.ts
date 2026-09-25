import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variable helper supporting both Vite (import.meta.env) and Node.js (process.env)
function getEnv(key: string): string {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] || '';
    }
  } catch {}

  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key] || '';
    }
  } catch {}

  return '';
}

const rawSupabaseUrl = (getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL')).trim();
const rawSupabaseAnonKey = (getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY')).trim();

/**
 * Checks whether a valid HTTP/HTTPS URL string was provided for Supabase
 */
function isValidHttpUrl(stringUrl: string): boolean {
  if (!stringUrl || typeof stringUrl !== 'string') return false;
  
  // Exclude common placeholders
  if (
    stringUrl.includes('your-supabase-url') ||
    stringUrl.includes('your-project-ref') ||
    stringUrl.includes('example.com')
  ) {
    return false;
  }

  try {
    const url = new URL(stringUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidAnonKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  if (key.includes('your-anon-key') || key.includes('your-anon-public-key')) {
    return false;
  }
  return key.trim().length > 10;
}

/**
 * Safely initialize Supabase client without throwing uncaught module load errors
 */
function initSupabase(): SupabaseClient | null {
  if (!isValidHttpUrl(rawSupabaseUrl) || !isValidAnonKey(rawSupabaseAnonKey)) {
    return null;
  }

  try {
    return createClient(rawSupabaseUrl, rawSupabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('Could not initialize Supabase client:', err);
    return null;
  }
}

export const supabase: SupabaseClient | null = initSupabase();

export const isSupabaseConfigured = (): boolean => {
  return supabase !== null;
};

/**
 * Test connectivity with Supabase database
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  error?: string;
}> {
  if (!supabase || !isSupabaseConfigured()) {
    return {
      connected: false,
      message: 'Supabase credentials belum dikonfigurasi pada .env.',
    };
  }

  try {
    const { count, error } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        connected: false,
        message: `Koneksi gagal: ${error.message}`,
        error: error.message,
      };
    }

    return {
      connected: true,
      message: `Terhubung ke Supabase PostgreSQL (${count ?? 0} kategori terdeteksi).`,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      message: `Koneksi gagal: ${errorMessage}`,
      error: errorMessage,
    };
  }
}
