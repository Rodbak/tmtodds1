import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/session";
import { planCoversTier, isPlanActive, type Tier } from "@/lib/plans";
import type { ChatMessageDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

// Which plan tier a channel requires to read or post in it. This is
// the same idea as the original "locked #correct-score" channel —
// except now it's enforced server-side instead of just styled that way.
const CHANNEL_ACCESS: Record<string, Tier> = {
  announcements: "free",
  general: "weekly",
  correct_score: "correct_score",
  "fixed-vip": "correct_score",
};

function effectivePlanFor(profile: Awaited<ReturnType<typeof getSessionProfile>>["profile"]) {
  return profile && isPlanActive(profile.plan, profile.planExpiresAt) ? profile.plan : null;
}

export async function GET(request: NextRequest) {
  const pinned = request.nextUrl.searchParams.get("pinned") === "true";
  
  if (pinned) {
    const channel = request.nextUrl.searchParams.get("channel");
    if (!channel) return NextResponse.json({ error: "channel required for pinned=true" }, { status: 400 });
    
    const { profile } = await getSessionProfile();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    
    return NextResponse.json({ 
      pinned: { 
        authorName: "TMT Admin", 
        body: "Today's fixed slip drops at 12:00 GMT. Stake responsibly — 1-2 units max.", 
        createdAt: new Date().toISOString(), 
        isAdmin: true 
      } 
    });
  }

  const channel = request.nextUrl.searchParams.get("channel") ?? "general";
  const requiredTier = CHANNEL_ACCESS[channel];
  if (!requiredTier) return NextResponse.json({ error: "Unknown channel" }, { status: 400 });

  const { profile } = await getSessionProfile();
  const allowed = planCoversTier(effectivePlanFor(profile), requiredTier);

  if (!allowed) return NextResponse.json({ locked: true, items: [] });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("channel", channel)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items: ChatMessageDTO[] = data.map((m) => ({
    id: m.id,
    authorId: m.author_id,
    authorName: m.author_name,
    isAdmin: m.is_admin,
    channel: m.channel,
    body: m.body,
    createdAt: m.created_at,
  }));

  return NextResponse.json({ locked: false, items });
}

export async function POST(request: NextRequest) {
  const pinned = request.nextUrl.searchParams.get("pinned") === "true";
  
  if (pinned) {
    const { profile } = await getSessionProfile();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    
    const body = await request.json().catch(() => null);
    const channel = body?.channel;
    const messageBody = (body?.body ?? "").trim();
    
    if (!channel || !messageBody) {
      return NextResponse.json({ error: "channel and body required" }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true, 
      pinned: { 
        channel, 
        authorName: "TMT Admin", 
        body: messageBody, 
        createdAt: new Date().toISOString(), 
        isAdmin: true 
      } 
    }, { status: 201 });
  }

  const { userId, profile } = await getSessionProfile();
  if (!userId || !profile) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const channel: string = body?.channel ?? "general";
  const text: string = (body?.body ?? "").trim();

  if (!text || text.length > 500) {
    return NextResponse.json({ error: "Message must be 1-500 characters" }, { status: 400 });
  }

  const requiredTier = CHANNEL_ACCESS[channel];
  if (!requiredTier) return NextResponse.json({ error: "Unknown channel" }, { status: 400 });

  if (channel === "announcements" && profile.role !== "admin") {
    return NextResponse.json({ error: "Only admin can post announcements" }, { status: 403 });
  }
  if (!planCoversTier(effectivePlanFor(profile), requiredTier)) {
    return NextResponse.json({ error: "Your plan doesn't include this channel" }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      author_id: userId,
      author_name: profile.name,
      is_admin: profile.role === "admin",
      channel,
      body: text,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const item: ChatMessageDTO = {
    id: data.id,
    authorId: data.author_id,
    authorName: data.author_name,
    isAdmin: data.is_admin,
    channel: data.channel,
    body: data.body,
    createdAt: data.created_at,
  };
  return NextResponse.json({ item }, { status: 201 });
}
