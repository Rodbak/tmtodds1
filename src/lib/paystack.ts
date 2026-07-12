import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { getPlan, type PlanId } from "@/lib/plans";

const PAYSTACK_API = "https://api.paystack.co";

export class PaystackError extends Error {
  constructor(message: string, readonly httpStatus: number) {
    super(message);
    this.name = "PaystackError";
  }
}

async function callPaystack<T = Record<string, unknown>>(
  path: string,
  options?: { method?: "GET" | "POST"; body?: Record<string, unknown> }
): Promise<{ status: boolean; message: string; data: T }> {
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    method: options?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await res.json();
  if (!res.ok || payload?.status === false) {
    throw new PaystackError(payload?.message ?? `Paystack returned HTTP ${res.status}`, res.status);
  }
  return payload;
}

type InitializePayload = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export function initializeTransaction(params: {
  email: string;
  amountPesewas: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  return callPaystack<InitializePayload>("/transaction/initialize", {
    method: "POST",
    body: {
      email: params.email,
      amount: params.amountPesewas,
      currency: "GHS",
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    },
  });
}

type VerifyPayload = {
  reference: string;
  status: "success" | "failed" | "abandoned" | string;
  amount: number;
  metadata?: { planId?: string; userId?: string };
};

export function verifyTransaction(reference: string) {
  return callPaystack<VerifyPayload>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/**
 * Confirms the `x-paystack-signature` header on an incoming webhook
 * body -- a timing-safe compare so a slow string equality check can't
 * leak information about how many leading bytes matched.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const expected = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!).update(rawBody).digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(signatureHeader, "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

type ActivationOutcome =
  | { activated: true; planId: PlanId; expiresAt: string }
  | { activated: false; reason: "unknown reference" | "already processed" | "transaction not successful" | "unknown plan" };

/**
 * Activates a subscription from a successful Paystack transaction.
 * Both the webhook and the /vip/callback verify route call this, often
 * for the same reference -- it's written to be safe either way: the
 * `payment.status === "success"` guard means a second call is a no-op
 * rather than a double-extended plan.
 */
export async function activateFromTransaction(transaction: {
  reference: string;
  amount: number;
  status: string;
  metadata?: { planId?: string; userId?: string };
}): Promise<ActivationOutcome> {
  const db = createAdminClient();

  const { data: payment } = await db.from("payments").select("*").eq("reference", transaction.reference).single();
  if (!payment) return { activated: false, reason: "unknown reference" };
  if (payment.status === "success") return { activated: false, reason: "already processed" };

  if (transaction.status !== "success") {
    await db.from("payments").update({ status: "failed", raw_payload: transaction }).eq("reference", transaction.reference);
    return { activated: false, reason: "transaction not successful" };
  }

  const plan = getPlan(payment.plan as PlanId);
  if (!plan) return { activated: false, reason: "unknown plan" };

  // Duration can be overridden from the admin panel (plan_prices) --
  // the activated plan lasts as long as the settings said at payment
  // time, matching what the VIP tab advertised.
  const { data: override } = await db.from("plan_prices").select("period_days").eq("plan", plan.id).maybeSingle();
  const effectivePeriodDays = override?.period_days && override.period_days > 0 ? override.period_days : plan.periodDays;

  const msPerDay = 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + effectivePeriodDays * msPerDay).toISOString();

  await Promise.all([
    db.from("payments").update({ status: "success", raw_payload: transaction }).eq("reference", transaction.reference),
    db.from("profiles").update({ plan: plan.id, plan_expires_at: expiresAt }).eq("id", payment.user_id),
  ]);

  return { activated: true, planId: plan.id, expiresAt };
}
