// lib/supabase/server.ts
// Server-side Supabase client — uses the service_role key (NEVER expose this to browser)
// Bypasses RLS completely — use ONLY in:
//   - API route handlers (app/api/*)
//   - Server Components (app/page.tsx, etc. when data fetching is needed)
//   - Scripts (scripts/*.ts)

import { createClient } from '@supabase/supabase-js';

// Note: this is NOT a singleton — API routes run in isolated serverless contexts
// Each invocation gets a fresh client. That's fine and expected on Vercel.
// Validation is inside the function (not at module level) so builds don't fail
// if env vars are injected at runtime rather than build time.
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase server env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel project settings.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // Service role doesn't need session persistence
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
