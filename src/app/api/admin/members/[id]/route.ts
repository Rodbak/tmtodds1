import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { grantPlanToProfile } from "@/lib/grantPlan";

export const dynamic = "force-dynamic";

/**
 * Admin actions on one member:
 *   { action: "setPlan", planId }        grant/extend a plan (expiry recomputed from now)
 *   { action: "removePlan" }             clear plan + expiry
 *   { action: "resetPassword", newPassword }  for members locked out (username accounts have no email reset)
 * Other admins' accounts are off-limits -- only the admin's own row
 * can be self-modified, so one compromised/careless admin session
 * can't lock out the rest.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action;

  const db = createAdminClient();

  const { data: target } = await db.from("profiles").select("id, role").eq("id", id).single();
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (target.role === "admin" && target.id !== admin.userId) {
    return NextResponse.json({ error: "Another admin's account can't be modified from here" }, { status: 403 });
  }

  if (action === "setPlan") {
    if (!getPlan(body?.planId)) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
    const granted = await grantPlanToProfile(db, id, body.planId);
    if (!granted.ok) return NextResponse.json({ error: granted.error }, { status: 500 });
    return NextResponse.json({ ok: true, expiresAt: granted.expiresAt });
  }

  if (action === "removePlan") {
    const { error } = await db.from("profiles").update({ plan: null, plan_expires_at: null }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "resetPassword") {
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    const { error } = await db.auth.admin.updateUserById(id, { password: newPassword });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
