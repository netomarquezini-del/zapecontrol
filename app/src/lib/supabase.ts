import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser / public client — uses the anon key.
 * Safe to use in client components and server components that only need
 * row-level-security–scoped reads.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey
);

/**
 * Service-role client — bypasses RLS.
 * Use only in server-side code (API routes, server actions, scripts).
 * Returns a new client each call so callers can't accidentally share state.
 */
export function getServiceSupabase(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. The service-role client can only be used server-side."
    );
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
