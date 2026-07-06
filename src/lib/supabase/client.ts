import { createBrowserClient } from "@supabase/ssr";

// Placeholder values let the client construct (and the app build/
// prerender its static shell) even before real Supabase credentials
// exist. Any actual request made with these fails at request time with
// a normal network error -- exactly where a missing-credentials
// problem should surface, rather than as a build-time crash.
const FALLBACK_URL = "https://placeholder.supabase.co";
const FALLBACK_ANON_KEY = "placeholder-anon-key";

/**
 * Supabase client for use in Client Components (the browser).
 * Uses the public anon key -- safe to expose, since row-level security
 * on every table decides what this key can actually read or write.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY
  );
}
