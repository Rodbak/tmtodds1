import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const API_BASE = "https://v3.football.api-sports.io";
const FETCH_TIMEOUT_MS = 8000;

// Shape of one result the admin fixture picker renders. kickoffAt is
// the provider's ISO timestamp; the client converts it into the
// datetime-local format its form field wants.
export type FixtureSearchResult = {
  externalFixtureId: string;
  league: string;
  country: string;
  home: string;
  away: string;
  kickoffAt: string;
};

type ApiFixtureItem = {
  fixture: { id: number; date: string };
  league: { name: string; country: string };
  teams: { home: { name: string }; away: { name: string } };
};

/**
 * Admin-only fixture lookup for the "post a pick" form. api-football
 * has no free-text fixture search, but it can list every fixture on a
 * given date in one request -- so we fetch the day and filter by the
 * query text server-side. One upstream request per search, admin-only,
 * so it can't be used by visitors to drain the API quota.
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const apiKey = process.env.SPORTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "SPORTS_API_KEY is not configured — add it to use fixture search" }, { status: 501 });
  }

  const date = request.nextUrl.searchParams.get("date") ?? "";
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }
  if (q.length < 3) {
    return NextResponse.json({ error: "Type at least 3 characters to search" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}/fixtures?date=${date}`, {
      headers: { "x-apisports-key": apiKey },
      signal: controller.signal,
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Scores provider returned HTTP ${res.status}` }, { status: 502 });
    }

    const json = await res.json();
    const all: ApiFixtureItem[] = Array.isArray(json?.response) ? json.response : [];

    const items: FixtureSearchResult[] = all
      .filter((f) => {
        const haystack = `${f.teams.home.name} ${f.teams.away.name} ${f.league.name} ${f.league.country}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 20)
      .map((f) => ({
        externalFixtureId: String(f.fixture.id),
        league: f.league.name,
        country: f.league.country,
        home: f.teams.home.name,
        away: f.teams.away.name,
        kickoffAt: f.fixture.date,
      }));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Fixture search timed out — try again" }, { status: 504 });
  } finally {
    clearTimeout(timeout);
  }
}
