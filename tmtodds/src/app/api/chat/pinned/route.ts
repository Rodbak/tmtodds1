import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const channel = request.nextUrl.searchParams.get("channel");
  if (!channel) return NextResponse.json({ error: "channel query param required" }, { status: 400 });

  return NextResponse.json({ 
    pinned: { 
      authorName: "TMT Admin", 
      body: "Today's fixed slip drops at 12:00 GMT. Stake responsibly — 1-2 units max.", 
      createdAt: new Date().toISOString(), 
      isAdmin: true 
    } 
  });
}

export async function POST(request: NextRequest) {
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