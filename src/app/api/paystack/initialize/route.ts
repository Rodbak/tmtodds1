import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/session";
import { getPlan, ghsToPesewas } from "@/lib/plans";
import { initializeTransaction } from "@/lib/paystack";

export const dynamic = "force-dynamic";

function newReference(): string {
  // "tmt_" prefix makes references easy to spot in the Paystack
  // dashboard among transactions from other apps on the same account.
  return `tmt_${randomUUID()}`;
}

/**
 * Starts a Paystack checkout for the signed-in user's chosen plan.
 * Writes a `pending` payments row *before* calling Paystack, so the
 * reference exists in our database no matter what Paystack does with
 * the request -- activateFromTransaction() looks it up by that
 * reference later and has nothing to activate if the row is missing.
 */
export async function POST(request: NextRequest) {
  const { userId, profile } = await getSessionProfile();
  if (!userId || !profile) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const plan = getPlan(body?.planId);
  if (!plan) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  const amountPesewas = ghsToPesewas(plan.priceGHS);
  const reference = newReference();

  const db = createAdminClient();
  const { error: insertError } = await db.from("payments").insert({
    user_id: userId,
    plan: plan.id,
    amount_pesewas: amountPesewas,
    reference,
    status: "pending",
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const { data } = await initializeTransaction({
      email: profile.email,
      amountPesewas,
      reference,
      callbackUrl: `${siteUrl}/vip/callback`,
      metadata: { planId: plan.id, userId },
    });
    return NextResponse.json({ authorizationUrl: data.authorization_url, reference });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Paystack error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
