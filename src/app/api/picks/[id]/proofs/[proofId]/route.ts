import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const BUCKET = "proof-images";

/** Removes one proof image -- both the storage object and its row. */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string; proofId: string }> }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: pickId, proofId } = await params;
  const db = createAdminClient();

  const { data: proof } = await db.from("pick_proofs").select("id, image_path").eq("id", proofId).eq("pick_id", pickId).single();
  if (!proof) return NextResponse.json({ error: "Proof not found" }, { status: 404 });

  const { error: removeError } = await db.storage.from(BUCKET).remove([proof.image_path]);
  if (removeError) return NextResponse.json({ error: removeError.message }, { status: 500 });

  const { error: deleteError } = await db.from("pick_proofs").delete().eq("id", proofId);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
