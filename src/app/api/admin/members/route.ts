import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { grantPlanToProfile } from "@/lib/grantPlan";
import { isValidUsername, normalizeUsername, usernameToEmail, displayLogin } from "@/lib/memberAuth";

export const dynamic = "force-dynamic";

export type MemberDTO = {
  id: string;
  name: string;
  login: string;
  role: "subscriber" | "admin";
  plan: string | null;
  planExpiresAt: string | null;
  createdAt: string;
};

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  role: "subscriber" | "admin";
  plan: string | null;
  plan_expires_at: string | null;
  created_at: string;
};

function toMemberDTO(row: ProfileRow): MemberDTO {
  return {
    id: row.id,
    name: row.name,
    login: displayLogin(row.email),
    role: row.role,
    plan: row.plan,
    planExpiresAt: row.plan_expires_at,
    createdAt: row.created_at,
  };
}

/** Admin-only member list, newest first, optional ?q= name/login search. */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const db = createAdminClient();

  let query = db
    .from("profiles")
    .select("id, name, email, role, plan, plan_expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: ((data ?? []) as ProfileRow[]).map(toMemberDTO) });
}

/**
 * Admin creates a member directly -- for customers without an email
 * address. The account is username+password; under the hood Supabase
 * gets a synthetic address on a placeholder domain (never emailed),
 * pre-confirmed so no confirmation mail is attempted. Optionally
 * grants a paid plan in the same step (cash/direct-MoMo sales).
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const usernameInput = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const planId = body?.planId ?? null;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!isValidUsername(usernameInput)) {
    return NextResponse.json(
      { error: "Username must be 3-30 characters: lowercase letters, numbers, dots, dashes, underscores — no spaces" },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  if (planId !== null && !getPlan(planId)) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  const username = normalizeUsername(usernameInput);
  const db = createAdminClient();

  const { data: created, error: createError } = await db.auth.admin.createUser({
    email: usernameToEmail(username),
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (createError || !created?.user) {
    const message = createError?.message ?? "Could not create the account";
    const friendly = /already|registered|exists/i.test(message) ? `Username "${username}" is already taken` : message;
    return NextResponse.json({ error: friendly }, { status: 400 });
  }

  if (planId) {
    const granted = await grantPlanToProfile(db, created.user.id, planId);
    if (!granted.ok) {
      // Account exists but the plan didn't attach -- report precisely
      // so admin can fix it from the member list instead of retrying
      // the whole creation (which would hit "username taken").
      return NextResponse.json(
        { error: `Account created (username "${username}"), but assigning the plan failed: ${granted.error}. Set it from the member list.` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true, username }, { status: 201 });
}
