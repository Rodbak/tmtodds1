import { NextRequest, NextResponse } from "next/server";
import { fetchLiveScores } from "@/lib/liveScores";

export const dynamic = "force-dynamic";

// No auth check: this only ever returns public match state (score,
// clock, status) for fixture ids the client already has from a pick
// it was allowed to see -- nothing here reveals a locked pick's market
// or odds.
export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids.length === 0) return NextResponse.json({ items: [] });

  const items = await fetchLiveScores(ids);
  return NextResponse.json({ items });
}
