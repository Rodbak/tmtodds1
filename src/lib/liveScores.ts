import type { LiveScoreDTO } from "./types";

// Wraps api-football's direct API (api-sports.io) — the provider
// SETUP.md recommends for its free tier (~100 requests/day, enough for
// a handful of daily picks). Swap the base URL / headers here if you
// switch providers; nothing else in the app knows which one is in use.
const API_BASE = "https://v3.football.api-sports.io";
const FETCH_TIMEOUT_MS = 6000;
const CACHE_TTL_MS = 20_000;

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

const cache = new Map<string, { data: LiveScoreDTO[]; expiresAt: number }>();

/**
 * Fetches current status/score for a batch of fixture ids. Degrades to
 * an empty list (never throws) if the API key is missing, the request
 * fails, or the provider times out -- a flaky third-party score feed
 * should never break the board, just leave the live badge off.
 */
export async function fetchLiveScores(ids: string[]): Promise<LiveScoreDTO[]> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const cacheKey = uniqueIds.slice().sort().join(",");
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const apiKey = process.env.SPORTS_API_KEY;
  if (!apiKey) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    // api-football's fixtures endpoint takes multiple ids dash-joined
    // (documented max of 20 per request -- fine for a single day's board).
    const res = await fetch(`${API_BASE}/fixtures?ids=${uniqueIds.slice(0, 20).join("-")}`, {
      headers: { "x-apisports-key": apiKey },
      signal: controller.signal,
    });
    if (!res.ok) return [];

    const json = await res.json();
    const items: ApiFootballFixture[] = Array.isArray(json?.response) ? json.response : [];
    const data = items.map(mapFixtureResponse);

    cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
