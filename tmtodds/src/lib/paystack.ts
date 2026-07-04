import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { getPlan, type PlanId } from "@/lib/plans";

const PAYSTACK_BASE = "https://api.paystack.co";

async function paystackFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const json = await res.json();
  if (!res.ok || json.status === false) {
    throw new Error(json.message ?? `Paystack request failed (${res.status})`);
  }
  return json;
}

export async function initializeTransaction(params: {
  email: string;
  amountPesewas: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  return paystackFetch("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      amount: params.amountPesewas,
      currency: "GHS",
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });
}

export async function verifyTransaction(reference: string) {
  return paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/** Confirms the `x-paystack-signature` header on an incoming webhook body. */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const expected = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex");
  return expected === signatureHeader;
}

/**
 * Activates a subscription from a successful Paystack transaction.
 * Idempotent: safe to call from both the webhook and the callback-page
 * verify route without double-extending a plan, since it checks the
 * payment record's status before doing anything.
 */
export async function activateFromTransaction(data: {
  reference: string;
  amount: number;
  status: string;
  metadata?: { planId?: string; userId?: string };
}) {
  const supabase = createAdminClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("reference", data.reference)
    .single();

  if (!payment) return { activated: false, reason: "unknown reference" };
  if (payment.status === "success") return { activated: false, reason: "already processed" };
  if (data.status !== "success") {
    await supabase.from("payments").update({ status: "failed", raw_payload: data }).eq("reference", data.reference);
    return { activated: false, reason: "transaction not successful" };
  }

  const planId = payment.plan as PlanId;
  const plan = getPlan(planId);
  if (!plan) return { activated: false, reason: "unknown plan" };

  const expiresAt = new Date(Date.now() + plan.periodDays * 24 * 60 * 60 * 1000).toISOString();

  await Promise.all([
    supabase.from("payments").update({ status: "success", raw_payload: data }).eq("reference", data.reference),
    supabase.from("profiles").update({ plan: planId, plan_expires_at: expiresAt }).eq("id", payment.user_id),
  ]);

  return { activated: true, planId, expiresAt };
}
