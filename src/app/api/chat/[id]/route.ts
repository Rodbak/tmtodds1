import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Removes a chat message outright. Moderation-only: there's no
 * "edit" or "hide" state, since the lounge has no history/audit
 * requirement the way settled picks or payments do -- a removed
 * message is just gone, the same as the person never sent it.
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { error } = await createAdminClient().from("chat_messages").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
