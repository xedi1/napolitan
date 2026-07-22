/**
 * Supabase Client
 * Browser Supabase client for direct browser-to-database connection
 *
 * This is the SOURCE OF TRUTH for all data in Cafe Napolitan.
 * The app connects directly to Supabase (REST + Realtime) from the browser.
 * No API routes needed - Supabase handles everything.
 */

import { createBrowserClient } from '@supabase/ssr';

// Singleton browser client
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!browserClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://your-project.supabase.co') {
      console.warn('[Supabase] Missing or unconfigured environment variables - running in demo mode');
      return null;
    }
    
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}

// Alias for convenience - returns null if not configured
export const supabase = typeof window !== 'undefined' ? getSupabaseClient() : null;
