import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getSessionProfile, requireAdmin } from "@/lib/session";
import { planCoversTier, isPlanActive, TIER_ORDER } from "@/lib/plans";
import type { PickDTO, LedgerStats, PickStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type PickRow = {
  id: string;
  league: string;
  fixture: string;
  market: string;
  odds: string | number;
  kickoff_at: string;
  tier: string;
  status: PickStatus;
  result_note: string | null;
  settled_at: string | null;
};

function computeStats(settledDesc: PickRow[], totalDelivered: number): LedgerStats {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const scoreable = settledDesc.filter((p) => p.status === "won" || p.status === "lost");

  const last30 = scoreable.filter((p) => p.settled_at && new Date(p.settled_at).getTime() >= thirtyDaysAgo);
  const wonLast30 = last30.filter((p) => p.status === "won").length;
  const lostLast30 = last30.filter((p) => p.status === "lost").length;
  const winRate30 = last30.length > 0 ? Math.round((wonLast30 / last30.length) * 100) : null;

  let streak = 0;
  for (const p of scoreable) {
    if (p.status === "won") streak += 1;
    else break;
  }

  return { winRate30, wonLast30, lostLast30, streak, totalDelivered };
}

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope") === "ledger" ? "ledger" : "today";
  const supabase = createAdminClient();
  const { profile } = await getSessionProfile();
  const effectivePlan = profile && isPlanActive(profile.plan, profile.planExpiresAt) ? profile.plan : null;

  if (scope === "ledger") {
    // The ledger shows every pick, not just settled ones (a still-open
    // pending pick belongs on the proof screen too) -- but only settled
    // rows count toward win-rate/streak, so that's a separate query.
    const [{ data: combined, error }, { data: settledForStats }, { count }] = await Promise.all([
      supabase.from("picks").select("*").order("kickoff_at", { ascending: false }).limit(200),
      supabase.from("picks").select("*").neq("status", "pending").order("settled_at", { ascending: false }).limit(200),
      supabase.from("picks").select("id", { count: "exact", head: true }),
    ]);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (combined ?? []) as PickRow[];
    const items: PickDTO[] = rows.map((p) => {
      const tier = p.tier as PickDTO["tier"];
      // Settled results stay fully visible, proving the track record.
      // A pick still awaiting kickoff is masked exactly like the board
      // is, so the proof screen can't double as a way to peek at a
      // paid pick before unlocking it.
      const locked = p.status === "pending" && !planCoversTier(effectivePlan, tier);
      return {
        id: p.id,
        league: p.league,
        fixture: p.fixture,
        kickoffAt: p.kickoff_at,
        tier,
        status: p.status,
        resultNote: p.result_note,
        locked,
        market: locked ? null : p.market,
        odds: locked ? null : Number(p.odds),
      };
    });

    const stats = computeStats((settledForStats ?? []) as PickRow[], count ?? rows.length);
    return NextResponse.json({ items, stats });
  }

  // scope === "today"
  const { data, error } = await supabase
    .from("picks")
    .select("*")
    .eq("status", "pending")
    .order("kickoff_at", { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items: PickDTO[] = (data as PickRow[]).map((p) => {
    const tier = p.tier as PickDTO["tier"];
    const locked = !planCoversTier(effectivePlan, tier);
    return {
      id: p.id,
      league: p.league,
      fixture: p.fixture,
      kickoffAt: p.kickoff_at,
      tier,
      status: p.status,
      resultNote: p.result_note,
      locked,
      market: locked ? null : p.market,
      odds: locked ? null : Number(p.odds),
    };
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const { league, fixture, market, odds, kickoffAt, tier } = body ?? {};

  if (!league || !fixture || !market || !odds || !kickoffAt || !tier) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!TIER_ORDER.includes(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("picks")
    .insert({ league, fixture, market, odds, kickoff_at: kickoffAt, tier })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data }, { status: 201 });
}
