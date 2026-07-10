import { describe, it, expect } from "vitest";
import { mapFixtureResponse, isLiveStatus } from "./liveScores";

describe("mapFixtureResponse", () => {
  it("maps a live in-progress fixture", () => {
    const raw = {
      fixture: { id: 12345, status: { short: "2H", elapsed: 63 } },
      goals: { home: 1, away: 0 },
    };
    expect(mapFixtureResponse(raw)).toEqual({
      externalFixtureId: "12345",
      status: "2H",
      elapsed: 63,
      homeScore: 1,
      awayScore: 0,
    });
  });

  it("maps a not-started fixture with null score/elapsed", () => {
    const raw = {
      fixture: { id: 999, status: { short: "NS", elapsed: null } },
      goals: { home: null, away: null },
    };
    expect(mapFixtureResponse(raw)).toEqual({
      externalFixtureId: "999",
      status: "NS",
      elapsed: null,
      homeScore: null,
      awayScore: null,
    });
  });

  it("always stringifies the fixture id, since it's stored/compared as text everywhere else", () => {
    const raw = { fixture: { id: 42, status: { short: "FT", elapsed: 90 } }, goals: { home: 2, away: 2 } };
    expect(mapFixtureResponse(raw).externalFixtureId).toBe("42");
  });
});

describe("isLiveStatus", () => {
  it("treats in-progress codes as live", () => {
    for (const status of ["1H", "HT", "2H", "ET", "P"]) {
      expect(isLiveStatus(status)).toBe(true);
    }
  });

  it("does not treat not-started/finished/postponed codes as live", () => {
    for (const status of ["NS", "FT", "PST", "CANC", "AET"]) {
      expect(isLiveStatus(status)).toBe(false);
    }
  });
});
