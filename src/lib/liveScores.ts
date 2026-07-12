import type { SupabaseClient } from "@supabase/supabase-js";
import type { LiveScoreDTO } from "./types";

// Wraps api-football's direct API (api-sports.io) — the provider
// SETUP.md recommends for its free tier (~100 requests/day, enough for
// a handful of daily picks). Swap the base URL / headers here if you
// switch providers; nothing else in the app knows which one is in use.
const API_BASE = "https://v3.football.api-sports.io";
const FETCH_TIMEOUT_MS = 6000;
// How long a cached score stays "fresh". The cache lives in Postgres
// (live_score_cache, see schema.sql) and is shared by every visitor
// and every serverless instance -- so upstream usage is bounded at
// roughly one request per minute while a match is on, no matter how
// many people are watching. That's what keeps the ~100 requests/day
// free tier workable.
const CACHE_TTL_MS = 60_000;

// Statuses api-football uses for a match that's actually in progress.
// Everything else (NS, FT, PST, CANC, ...) just isn't "live" -- still
// returned to the caller (score/status are shown either way), but the
// UI badge only lights up for these.
export const LIVE_MATCH_STATUSES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"]);

export function isLiveStatus(status: string): boolean {
  return LIVE_MATCH_STATUSES.has(status);
}

type ApiFootballFixture = {
  fixture: { id: number; status: { short: string; elapsed: number | null } };
  goals: { home: number | null; away: number | null };
};

/** Pure mapping from one api-football response item to our own shape -- kept separate from the network call so it's cheap to unit test against a captured sample response. */
export function mapFixtureResponse(item: ApiFootballFixture): LiveScoreDTO {
  return {
    externalFixtureId: String(item.fixture.id),
    status: item.fixture.status.short,
    elapsed: item.fixture.status.elapsed,
    homeScore: item.goals.home,
    awayScore: item.goals.away,
  };
}

type CacheRow = {
  fixture_id: string;
  status: string;
  elapsed: number | null;
  home_score: number | null;
  away_score: number | null;
  fetched_at: string;
};

function rowToDTO(row: CacheRow): LiveScoreDTO {
  return {
    externalFixtureId: row.fixture_id,
    status: row.status,
    elapsed: row.elapsed,
    homeScore: row.home_score,
    awayScore: row.away_score,
  };
}

/** One raw call to the scores provider. Never throws -- an empty list means "couldn't fetch", and callers fall back to whatever the cache has. */
async function fetchFromUpstream(ids: string[]): Promise<LiveScoreDTO[]> {
  const apiKey = process.env.SPORTS_API_KEY;
  if (!apiKey || ids.length === 0) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    // api-football's fixtures endpoint takes multiple ids dash-joined
    // (documented max of 20 per request -- fine for a single day's board).
    const res = await fetch(`${API_BASE}/fixtures?ids=${ids.slice(0, 20).join("-")}`, {
      headers: { "x-apisports-key": apiKey },
      signal: controller.signal,
    });
    if (!res.ok) return [];

    const json = await res.json();
    const items: ApiFootballFixture[] = Array.isArray(json?.response) ? json.response : [];
    return items.map(mapFixtureResponse);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetches current status/score for a batch of fixture ids through the
 * shared live_score_cache table: fresh rows are served as-is, stale or
 * missing ones trigger a single upstream call whose result is written
 * back for every other visitor/instance to reuse. Degrades to whatever
 * the cache holds (possibly nothing) if the API key is missing or the
 * provider errors -- a flaky score feed never breaks the board, it
 * just leaves the badge off or a minute behind.
 */
export async function fetchLiveScores(db: SupabaseClient, ids: string[]): Promise<LiveScoreDTO[]> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const { data: cachedRows } = await db.from("live_score_cache").select("*").in("fixture_id", uniqueIds);
  const rows = (cachedRows ?? []) as CacheRow[];

  const freshCutoff = Date.now() - CACHE_TTL_MS;
  const byId = new Map<string, CacheRow>(rows.map((r) => [r.fixture_id, r]));
  const staleIds = uniqueIds.filter((id) => {
    const row = byId.get(id);
    return !row || new Date(row.fetched_at).getTime() < freshCutoff;
  });

  if (staleIds.length > 0) {
    const fetched = await fetchFromUpstream(staleIds);
    if (fetched.length > 0) {
      const now = new Date().toISOString();
      await db.from("live_score_cache").upsert(
        fetched.map((s) => ({
          fixture_id: s.externalFixtureId,
          status: s.status,
          elapsed: s.elapsed,
          home_score: s.homeScore,
          away_score: s.awayScore,
          fetched_at: now,
        }))
      );
      for (const s of fetched) {
        byId.set(s.externalFixtureId, {
          fixture_id: s.externalFixtureId,
          status: s.status,
          elapsed: s.elapsed,
          home_score: s.homeScore,
          away_score: s.awayScore,
          fetched_at: now,
        });
      }
    }
  }

  return uniqueIds.flatMap((id) => {
    const row = byId.get(id);
    return row ? [rowToDTO(row)] : [];
  });
}
