import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/session";
import type { PickProofDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const BUCKET = "proof-images";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

/** Uploads one or more bet-slip screenshots for a settled pick (admin-only, multipart/form-data under the "files" field). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: pickId } = await params;
  const db = createAdminClient();

  const { data: pick } = await db.from("picks").select("id").eq("id", pickId).single();
  if (!pick) return NextResponse.json({ error: "Pick not found" }, { status: 404 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "No files provided" }, { status: 400 });

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: `${file.name} is not an image` }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: `${file.name} is larger than 5MB` }, { status: 400 });
    }
  }

  const created: PickProofDTO[] = [];
  for (const file of files) {
    const path = `${pickId}/${randomUUID()}-${sanitizeFilename(file.name)}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await db.storage.from(BUCKET).upload(path, bytes, { contentType: file.type });
    if (uploadError) return NextResponse.json({ error: uploadError.message, uploaded: created }, { status: 500 });

    const { data: row, error: insertError } = await db
      .from("pick_proofs")
      .insert({ pick_id: pickId, image_path: path })
      .select("id")
      .single();
    if (insertError) return NextResponse.json({ error: insertError.message, uploaded: created }, { status: 500 });

    const { data: publicUrl } = db.storage.from(BUCKET).getPublicUrl(path);
    created.push({ id: row.id, url: publicUrl.publicUrl });
  }

  return NextResponse.json({ items: created }, { status: 201 });
}
