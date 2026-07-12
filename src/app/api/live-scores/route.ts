import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { fetchLiveScores } from "@/lib/liveScores";

export const dynamic = "force-dynamic";

// No auth check: this only ever returns public match state (score,
// clock, status) for fixtures attached to a posted pick -- nothing
// here reveals a locked pick's market or odds. Requested ids are
// checked against the picks table first, so a stranger can't burn the
// upstream API quota by requesting made-up fixture ids all day.
export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids") ?? "";
  const requestedIds = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 50);

  if (requestedIds.length === 0) return NextResponse.json({ items: [] });

  const db = createAdminClient();
  const { data: knownPicks } = await db.from("picks").select("external_fixture_id").in("external_fixture_id", requestedIds);
  const allowedIds = Array.from(new Set((knownPicks ?? []).flatMap((p) => (p.external_fixture_id ? [p.external_fixture_id] : []))));

  if (allowedIds.length === 0) return NextResponse.json({ items: [] });

  const items = await fetchLiveScores(db, allowedIds);
  return NextResponse.json({ items });
}
