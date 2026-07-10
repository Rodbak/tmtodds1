"use client";

import { useEffect, useState } from "react";
import type { LiveScoreDTO } from "./types";

const POLL_INTERVAL_MS = 30_000;
// A pick becomes eligible to poll a little before kickoff (so "kickoff
// imminent" still refreshes) and stays eligible for a few hours after,
// covering extra time/delays -- past that window it's assumed over and
// just awaiting a manual settle, so polling stops on its own.
const LOOKAHEAD_MS = 15 * 60 * 1000;
const LOOKBACK_MS = 4 * 60 * 60 * 1000;

export type LiveScoreEligiblePick = { externalFixtureId: string | null; kickoffAt: string };

function eligibleIds(picks: LiveScoreEligiblePick[]): string[] {
  const now = Date.now();
  return picks
    .filter((p): p is LiveScoreEligiblePick & { externalFixtureId: string } => !!p.externalFixtureId)
    .filter((p) => {
      const kickoff = new Date(p.kickoffAt).getTime();
      return kickoff - LOOKAHEAD_MS <= now && kickoff + LOOKBACK_MS >= now;
    })
    .map((p) => p.externalFixtureId);
}

/** Polls /api/live-scores for whichever picks currently have a live-eligible kickoff window, keyed by externalFixtureId. */
export function useLiveScores(picks: LiveScoreEligiblePick[], enabled: boolean = true): Record<string, LiveScoreDTO> {
  const [scores, setScores] = useState<Record<string, LiveScoreDTO>>({});
  const ids = eligibleIds(picks).sort().join(",");

  useEffect(() => {
    if (!enabled || !ids) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScores({});
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/live-scores?ids=${encodeURIComponent(ids)}`);
        const json = await res.json();
        if (cancelled) return;
        const map: Record<string, LiveScoreDTO> = {};
        for (const item of (json.items ?? []) as LiveScoreDTO[]) map[item.externalFixtureId] = item;
        setScores(map);
      } catch {
        // A flaky third-party score feed shouldn't disrupt the rest of
        // the app -- just leave whatever scores we last had.
      }
    };

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [ids, enabled]);

  return scores;
}
