import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

function toProfile(row: {
  id: string;
  name: string;
  email: string;
  role: "subscriber" | "admin";
  plan: string | null;
  plan_expires_at: string | null;
}): Profile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    plan: row.plan as Profile["plan"],
    planExpiresAt: row.plan_expires_at,
  };
}

/**
 * Reads the logged-in user (if any) and their profile row, using the
 * cookie-scoped Supabase client -- RLS's "read own profile" policy
 * allows exactly this and nothing more, so this is safe to call from
 * any Route Handler without a service-role key.
 */
export async function getSessionProfile(): Promise<{ userId: string | null; profile: Profile | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { userId: null, profile: null };

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return { userId: user.id, profile: data ? toProfile(data) : null };
}

/** Convenience guard for admin-only routes. */
export async function requireAdmin() {
  const { userId, profile } = await getSessionProfile();
  if (!userId || profile?.role !== "admin") {
    return { ok: false as const };
  }
  return { ok: true as const, userId, profile };
}
