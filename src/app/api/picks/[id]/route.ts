import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

type SettleStatus = "won" | "lost" | "void";
const SETTLE_STATUSES: SettleStatus[] = ["won", "lost", "void"];

function isSettleStatus(value: unknown): value is SettleStatus {
  return typeof value === "string" && (SETTLE_STATUSES as string[]).includes(value);
}

/** 403s the request if the caller isn't signed in as an admin; otherwise returns nothing. */
async function assertAdmin() {
  const admin = await requireAdmin();
  return admin.ok ? null : NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/** Settles a pending pick as won/lost/void, with an optional note (e.g. "72' pen. miss"). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await assertAdmin();
  if (forbidden) return forbidden;

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!isSettleStatus(body?.status)) {
    return NextResponse.json({ error: "status must be won, lost, or void" }, { status: 400 });
  }
  const resultNote = typeof body?.resultNote === "string" ? body.resultNote : null;

  const db = createAdminClient();
  const { data: settledPick, error } = await db
    .from("picks")
    .update({ status: body.status, result_note: resultNote, settled_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: settledPick });
}

/** Removes a pick outright -- for correcting a mis-entered posting, not for settling it. */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await assertAdmin();
  if (forbidden) return forbidden;

  const { id } = await params;
  const { error } = await createAdminClient().from("picks").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
