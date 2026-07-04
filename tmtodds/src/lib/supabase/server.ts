import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Supabase client for use in Server Components, Route Handlers, and
 * Server Actions. Reads the user's session from cookies, so RLS
 * policies that check auth.uid() work correctly on the server too.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
            // setAll is called from a Server Component sometimes — safe to
            // ignore if you have middleware refreshing sessions instead.
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
 * allow (e.g. reading every subscriber's plan to check access, or
 * writing settlement results as the system rather than as a user).
 */
export function createAdminClient() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
