import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction, activateFromTransaction } from "@/lib/paystack";

export const dynamic = "force-dynamic";

// Called from the /vip/callback page right after Paystack redirects
// the user back, so they don't have to wait on the webhook to see a
// confirmation. Safe to call even if the webhook already ran —
// activateFromTransaction() is idempotent.
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  if (!reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 });

  try {
    const result = await verifyTransaction(reference);
    const status = result.data.status as string;

    if (status === "success") {
      await activateFromTransaction({
        reference: result.data.reference,
        amount: result.data.amount,
        status: result.data.status,
        metadata: result.data.metadata,
      });
    }

    return NextResponse.json({ status });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Paystack error" }, { status: 502 });
  }
}
