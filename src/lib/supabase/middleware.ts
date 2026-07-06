import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// See lib/supabase/client.ts for why these fallbacks exist.
const FALLBACK_URL = "https://placeholder.supabase.co";
const FALLBACK_ANON_KEY = "placeholder-anon-key";

/**
 * Refreshes the Supabase auth session on every request so server
 * components always see an up-to-date cookie. Standard Supabase +
 * Next.js App Router pattern -- without it, sessions can expire
 * client-side without the server ever finding out.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Touches the session so expired tokens get refreshed before any
  // Server Component or Route Handler reads the cookies.
  await supabase.auth.getUser();

  return supabaseResponse;
}
