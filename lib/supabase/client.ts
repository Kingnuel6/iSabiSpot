// lib/supabase/client.ts
// Browser-side Supabase client — uses the anon key (safe to expose)
// Anon key + RLS = public can only SELECT venues and summaries. No write access.
// Use this in Client Components and hooks (anything running in the browser)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
  );
}

// Singleton pattern — don't create a new client on every render
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
