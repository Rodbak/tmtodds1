import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/session";
import { planCoversTier, isPlanActive, type Tier } from "@/lib/plans";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import type { ChatMessageDTO, ChatAttachedPick, PickStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

// Which plan tier a channel requires to read or post in it. #general
// is open to any signed-in subscriber, #locked-vip is the main paid
// lounge, #correct-score is gated to the top plan -- enforced here,
// server-side, rather than just styled that way on the pill.
const CHANNEL_ACCESS: Record<string, Tier> = {
  general: "free",
  locked_vip: "weekly",
  correct_score: "correct_score",
};

type PickJoinRow = {
  league: string;
  fixture: string;
  kickoff_at: string;
  tier: string;
  status: PickStatus;
  market: string;
  odds: string | number;
} | null;

type MessageRow = {
  id: string;
  author_id: string | null;
  author_name: string;
  is_admin: boolean;
  is_pinned: boolean;
  channel: string;
  body: string;
  created_at: string;
  attached_pick: PickJoinRow;
};

function effectivePlanFor(profile: Awaited<ReturnType<typeof getSessionProfile>>["profile"]) {
  return profile && isPlanActive(profile.plan, profile.planExpiresAt) ? profile.plan : null;
}

function toAttachedPick(row: PickJoinRow, effectivePlan: Tier | null): ChatAttachedPick | null {
  if (!row) return null;
  const tier = row.tier as Tier;
  const locked = !planCoversTier(effectivePlan, tier);
  return {
    league: row.league,
    fixture: row.fixture,
    kickoffAt: row.kickoff_at,
    tier,
    status: row.status,
    locked,
    market: locked ? null : row.market,
    odds: locked ? null : Number(row.odds),
  };
}

function toMessageDTO(m: MessageRow, effectivePlan: Tier | null): ChatMessageDTO {
  return {
    id: m.id,
    authorId: m.author_id,
    authorName: m.author_name,
    isAdmin: m.is_admin,
    isPinned: m.is_pinned,
    channel: m.channel,
    body: m.body,
    attachedPick: toAttachedPick(m.attached_pick, effectivePlan),
    createdAt: m.created_at,
  };
}

const MESSAGE_SELECT =
  "id, author_id, author_name, is_admin, is_pinned, channel, body, created_at, attached_pick:picks(league, fixture, kickoff_at, tier, status, market, odds)";

export async function GET(request: NextRequest) {
  const channel = request.nextUrl.searchParams.get("channel") ?? "general";
  const requiredTier = CHANNEL_ACCESS[channel];
  if (!requiredTier) return NextResponse.json({ error: "Unknown channel" }, { status: 400 });

  const { profile } = await getSessionProfile();

  // The lounge is members-only in both directions: even #general can't
  // be read without signing in. lockReason tells the client which
  // prompt to show -- "log in" vs "upgrade your plan".
  if (!profile) {
    return NextResponse.json({ locked: true, lockReason: "auth", items: [], pinned: null });
  }

  const effectivePlan = effectivePlanFor(profile);
  const allowed = planCoversTier(effectivePlan, requiredTier);

  if (!allowed) return NextResponse.json({ locked: true, lockReason: "tier", items: [], pinned: null });

  const supabase = createAdminClient();

  const [{ data, error }, { data: pinnedRow }] = await Promise.all([
    supabase
      .from("chat_messages")
      .select(MESSAGE_SELECT)
      .eq("channel", channel)
      .order("created_at", { ascending: true })
      .limit(100),
    supabase
      .from("chat_messages")
      .select(MESSAGE_SELECT)
      .eq("channel", channel)
      .eq("is_pinned", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = ((data ?? []) as unknown as MessageRow[]).map((m) => toMessageDTO(m, effectivePlan));
  const pinned = pinnedRow ? toMessageDTO(pinnedRow as unknown as MessageRow, effectivePlan) : null;

  return NextResponse.json({ locked: false, items, pinned });
}

export async function POST(request: NextRequest) {
  const { userId, profile } = await getSessionProfile();
  if (!userId || !profile) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const withinLimit = await checkRateLimit(`chat:${userId}`, RATE_LIMITS.CHAT_POST.max, RATE_LIMITS.CHAT_POST.windowSeconds);
  if (!withinLimit) {
    return NextResponse.json({ error: "You're posting too fast — wait a moment and try again" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const channel: string = body?.channel ?? "general";
  const text: string = (body?.body ?? "").trim();
  const isAdmin = profile.role === "admin";

  if (!text || text.length > 500) {
    return NextResponse.json({ error: "Message must be 1-500 characters" }, { status: 400 });
  }

  const requiredTier = CHANNEL_ACCESS[channel];
  if (!requiredTier) return NextResponse.json({ error: "Unknown channel" }, { status: 400 });
  if (!planCoversTier(effectivePlanFor(profile), requiredTier)) {
    return NextResponse.json({ error: "Your plan doesn't include this channel" }, { status: 403 });
  }

  // Pinning a message and attaching a live pick card are admin tools
  // (matching the "Pinned by admin" banner in the design) -- a
  // non-admin's request is quietly downgraded rather than rejected,
  // since sending the message itself is still valid.
  const pinned = isAdmin && body?.pinned === true;
  const attachedPickId = isAdmin && typeof body?.attachedPickId === "string" ? body.attachedPickId : null;

  const supabase = createAdminClient();

  if (pinned) {
    // Only one pinned banner per channel -- unpin whatever came before.
    await supabase.from("chat_messages").update({ is_pinned: false }).eq("channel", channel).eq("is_pinned", true);
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      author_id: userId,
      author_name: profile.name,
      is_admin: isAdmin,
      is_pinned: pinned,
      attached_pick_id: attachedPickId,
      channel,
      body: text,
    })
    .select(MESSAGE_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const item = toMessageDTO(data as unknown as MessageRow, effectivePlanFor(profile));
  return NextResponse.json({ item }, { status: 201 });
}
