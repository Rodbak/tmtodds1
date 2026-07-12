import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/session";
import { PLANS, applyPlanOverrides, getPlan, type PlanOverride } from "@/lib/plans";

export const dynamic = "force-dynamic";

type OverrideRow = {
  plan: PlanOverride["plan"];
  price_ghs: number | null;
  period_days: number | null;
  hidden: boolean;
  tag: string | null;
  title: string | null;
  subtitle: string | null;
};

// Display-text fields the admin can override, with sane length caps
// for what the plan cards can render without breaking layout.
const TEXT_FIELDS = [
  { key: "tag", column: "tag", max: 40 },
  { key: "title", column: "title", max: 60 },
  { key: "subtitle", column: "subtitle", max: 80 },
] as const;

/**
 * Effective plan list: the defaults from plans.ts with any admin
 * overrides (price, duration, visibility) applied. Public — it's the
 * same pricing the VIP tab shows everyone; hidden plans are included
 * with their flag set and filtered client-side (nothing about a
 * paused plan's price is secret).
 */
export async function GET() {
  const db = createAdminClient();
  const { data, error } = await db.from("plan_prices").select("plan, price_ghs, period_days, hidden, tag, title, subtitle");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const overrides: PlanOverride[] = ((data ?? []) as OverrideRow[]).map((r) => ({
    plan: r.plan,
    priceGHS: r.price_ghs,
    periodDays: r.period_days,
    hidden: r.hidden,
    tag: r.tag,
    title: r.title,
    subtitle: r.subtitle,
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
  const textChanges = TEXT_FIELDS.filter((f) => body[f.key] !== undefined);
  if (!hasPrice && !hasPeriod && !hasHidden && textChanges.length === 0) {
    return NextResponse.json({ error: "Nothing to change" }, { status: 400 });
  }

  for (const f of textChanges) {
    const value = body[f.key];
    if (value !== null && typeof value !== "string") {
      return NextResponse.json({ error: `${f.key} must be text` }, { status: 400 });
    }
    if (typeof value === "string" && value.trim().length > f.max) {
      return NextResponse.json({ error: `${f.key} must be at most ${f.max} characters` }, { status: 400 });
    }
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
  const { data: existing } = await db
    .from("plan_prices")
    .select("price_ghs, period_days, hidden, tag, title, subtitle")
    .eq("plan", planId)
    .maybeSingle();

  // An empty/whitespace string clears the override -- stored as NULL,
  // which means "back to the coded default" everywhere it's read.
  const textValue = (key: (typeof TEXT_FIELDS)[number]["key"], fallback: string | null) => {
    if (body[key] === undefined) return fallback;
    const trimmed = typeof body[key] === "string" ? body[key].trim() : "";
    return trimmed || null;
  };

  const { error } = await db.from("plan_prices").upsert({
    plan: planId,
    price_ghs: hasPrice ? priceGHS : (existing?.price_ghs ?? null),
    period_days: hasPeriod ? periodDays : (existing?.period_days ?? null),
    hidden: hasHidden ? body.hidden : (existing?.hidden ?? false),
    tag: textValue("tag", existing?.tag ?? null),
    title: textValue("title", existing?.title ?? null),
    subtitle: textValue("subtitle", existing?.subtitle ?? null),
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
