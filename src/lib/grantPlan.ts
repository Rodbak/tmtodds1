import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPlan, ghsToPesewas, type PlanId } from "./plans";

/**
 * Grants a plan to a profile directly -- the admin-sold path (cash or
 * direct Mobile Money, no Paystack checkout). Expiry is computed from
 * the plan's *effective* duration (plan_prices override, else
 * default), the same as a Paystack activation would get, and a manual
 * payments row is written so admin-sold plans show up in the same
 * money trail as online ones.
 */
export async function grantPlanToProfile(
  db: SupabaseClient,
  userId: string,
  planId: PlanId
): Promise<{ ok: true; expiresAt: string } | { ok: false; error: string }> {
  const plan = getPlan(planId);
  if (!plan) return { ok: false, error: "Unknown plan" };

  const { data: override } = await db.from("plan_prices").select("price_ghs, period_days").eq("plan", planId).maybeSingle();
  const periodDays = override?.period_days && override.period_days > 0 ? override.period_days : plan.periodDays;
  const priceGHS = override?.price_ghs && override.price_ghs > 0 ? override.price_ghs : plan.priceGHS;

  const expiresAt = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString();

  const { error: profileError } = await db
    .from("profiles")
    .update({ plan: planId, plan_expires_at: expiresAt })
    .eq("id", userId);
  if (profileError) return { ok: false, error: profileError.message };

  const { error: paymentError } = await db.from("payments").insert({
    user_id: userId,
    plan: planId,
    amount_pesewas: ghsToPesewas(priceGHS),
    reference: `manual_${randomUUID()}`,
    status: "success",
    raw_payload: { source: "admin_manual" },
  });
  if (paymentError) return { ok: false, error: paymentError.message };

  return { ok: true, expiresAt };
}
