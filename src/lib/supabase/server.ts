import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// See client.ts for why these fallbacks exist: they let the app build
// and prerender its static shell before real Supabase credentials are
// in place. A request made with these fails normally at request time.
const FALLBACK_URL = "https://placeholder.supabase.co";
const FALLBACK_ANON_KEY = "placeholder-anon-key";
const FALLBACK_SERVICE_KEY = "placeholder-service-role-key";

/**
 * Supabase client for use in Server Components, Route Handlers, and
 * Server Actions. Reads the user's session from cookies, so RLS
 * policies that check auth.uid() work correctly on the server too.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component sometimes -- safe
            // to ignore since middleware.ts refreshes sessions instead.
          }
        },
      },
    }
  );
}

/**
 * Admin client using the service role key. This BYPASSES row-level
 * security entirely, so it only ever runs inside Route Handlers, never
 * in a Client Component and never sent to the browser. Use it when a
 * route needs to do something a normal user's RLS policy wouldn't
 * allow (checking a subscriber's plan, writing settlement results,
 * activating a plan from a webhook).
 */
export function createAdminClient() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
