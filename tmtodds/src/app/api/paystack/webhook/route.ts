import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, activateFromTransaction } from "@/lib/paystack";

export const dynamic = "force-dynamic";

// Paystack calls this server-to-server after every transaction event.
// It — not the browser redirect — is the source of truth for granting
// a plan, since a user can close their tab before the redirect fires.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    await activateFromTransaction({
      reference: event.data.reference,
      amount: event.data.amount,
      status: event.data.status,
      metadata: event.data.metadata,
    });
  }

  // Always 200 so Paystack doesn't retry events we've already handled
  // (or don't care about) — retries are for delivery failures, not
  // for "we chose to ignore this event type".
  return NextResponse.json({ received: true });
}
