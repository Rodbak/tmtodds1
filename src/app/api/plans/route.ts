import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/session";
import { PLANS, applyPlanOverrides, getPlan, type PlanOverride } from "@/lib/plans";

export const dynamic = "force-dynamic";

type OverrideRow = { plan: PlanOverride["plan"]; price_ghs: number | null; period_days: number | null; hidden: boolean };

/**
 * Effective plan list: the defaults from plans.ts with any admin
 * overrides (price, duration, visibility) applied. Public — it's the
 * same pricing the VIP tab shows everyone; hidden plans are included
 * with their flag set and filtered client-side (nothing about a
 * paused plan's price is secret).
 */
export async function GET() {
  const db = createAdminClient();
  const { data, error } = await db.from("plan_prices").select("plan, price_ghs, period_days, hidden");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const overrides: PlanOverride[] = ((data ?? []) as OverrideRow[]).map((r) => ({
    plan: r.plan,
    priceGHS: r.price_ghs,
    periodDays: r.period_days,
    hidden: r.hidden,
  }));
  return NextResponse.json({ items: applyPlanOverrides(PLANS, overrides) });
}

/**
 * Admin-only plan-settings change: { planId, priceGHS?, periodDays?,
 * hidden? }. Only the provided fields change; the rest of the row is
 * preserved (read-merge-upsert, since upsert alone would null out
 * omitted columns).
 */
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const planId = body?.planId;
  if (!getPlan(planId)) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

  const hasPrice = body.priceGHS !== undefined;
  const hasPeriod = body.periodDays !== undefined;
  const hasHidden = body.hidden !== undefined;
  if (!hasPrice && !hasPeriod && !hasHidden) {
    return NextResponse.json({ error: "Nothing to change" }, { status: 400 });
  }

  const priceGHS = hasPrice ? Number(body.priceGHS) : undefined;
  const periodDays = hasPeriod ? Number(body.periodDays) : undefined;
  if (hasPrice && (!Number.isInteger(priceGHS) || priceGHS! <= 0)) {
    return NextResponse.json({ error: "Price must be a whole number of Cedis greater than 0" }, { status: 400 });
  }
  if (hasPeriod && (!Number.isInteger(periodDays) || periodDays! <= 0)) {
    return NextResponse.json({ error: "Duration must be a whole number of days greater than 0" }, { status: 400 });
  }
  if (hasHidden && typeof body.hidden !== "boolean") {
    return NextResponse.json({ error: "hidden must be true or false" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: existing } = await db.from("plan_prices").select("price_ghs, period_days, hidden").eq("plan", planId).maybeSingle();

  const { error } = await db.from("plan_prices").upsert({
    plan: planId,
    price_ghs: hasPrice ? priceGHS : (existing?.price_ghs ?? null),
    period_days: hasPeriod ? periodDays : (existing?.period_days ?? null),
    hidden: hasHidden ? body.hidden : (existing?.hidden ?? false),
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
