import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/session";
import { getPlan, ghsToPesewas } from "@/lib/plans";
import { initializeTransaction } from "@/lib/paystack";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { userId, profile } = await getSessionProfile();
  if (!userId || !profile) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const plan = getPlan(body?.planId);
  if (!plan) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

  const amountPesewas = ghsToPesewas(plan.priceGHS);
  const reference = `tmt_${randomUUID()}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const supabase = createAdminClient();
  const { error: insertError } = await supabase.from("payments").insert({
    user_id: userId,
    plan: plan.id,
    amount_pesewas: amountPesewas,
    reference,
    status: "pending",
  });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  try {
    const result = await initializeTransaction({
      email: profile.email,
      amountPesewas,
      reference,
      callbackUrl: `${siteUrl}/vip/callback`,
      metadata: { planId: plan.id, userId },
    });
    return NextResponse.json({ authorizationUrl: result.data.authorization_url, reference });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Paystack error" }, { status: 502 });
  }
}
