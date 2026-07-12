import { describe, it, expect, vi, afterEach } from "vitest";
import { planCoversTier, isPlanActive, ghsToPesewas, getPlan, applyPlanOverrides, PLANS, TIER_ORDER } from "./plans";

describe("planCoversTier", () => {
  it("lets a null/no plan see only free content", () => {
    expect(planCoversTier(null, "free")).toBe(true);
    expect(planCoversTier(null, "weekly")).toBe(false);
    expect(planCoversTier(null, "correct_score")).toBe(false);
  });

  it("higher tiers include everything below them", () => {
    // This is the crux of the whole paywall: elite should see weekly
    // and pro content too, not just its own tier's picks.
    expect(planCoversTier("elite", "free")).toBe(true);
    expect(planCoversTier("elite", "weekly")).toBe(true);
    expect(planCoversTier("elite", "pro")).toBe(true);
    expect(planCoversTier("elite", "elite")).toBe(true);
    expect(planCoversTier("elite", "correct_score")).toBe(false);
  });

  it("does not let a lower tier see a higher tier's content", () => {
    expect(planCoversTier("weekly", "pro")).toBe(false);
    expect(planCoversTier("weekly", "elite")).toBe(false);
    expect(planCoversTier("weekly", "correct_score")).toBe(false);
  });

  it("only correct_score covers correct_score", () => {
    for (const tier of TIER_ORDER) {
      if (tier === "correct_score") continue;
      expect(planCoversTier(tier, "correct_score")).toBe(false);
    }
    expect(planCoversTier("correct_score", "correct_score")).toBe(true);
  });

  it("treats an unrecognized plan/tier value as no access, not a crash", () => {
    // @ts-expect-error -- deliberately passing a bad value to prove
    // this fails closed instead of throwing or defaulting to "allow".
    expect(planCoversTier("not-a-real-plan", "free")).toBe(false);
  });
});

describe("isPlanActive", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is false for the free tier even with a future expiry", () => {
    expect(isPlanActive("free" as never, new Date(Date.now() + 100000).toISOString())).toBe(false);
  });

  it("is false with no plan or no expiry date", () => {
    expect(isPlanActive(null, null)).toBe(false);
    expect(isPlanActive("pro", null)).toBe(false);
  });

  it("is true only while the expiry timestamp is still in the future", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));

    expect(isPlanActive("pro", "2026-01-15T12:00:01Z")).toBe(true);
    expect(isPlanActive("pro", "2026-01-15T11:59:59Z")).toBe(false);
  });
});

describe("ghsToPesewas", () => {
  it("converts Cedis to the integer subunit Paystack expects", () => {
    expect(ghsToPesewas(70)).toBe(7000);
    expect(ghsToPesewas(150)).toBe(15000);
    expect(ghsToPesewas(1000)).toBe(100000);
  });

  it("rounds rather than truncating, so a fractional Cedi can't quietly undercharge", () => {
    expect(ghsToPesewas(19.999)).toBe(2000);
  });
});

describe("getPlan / PLANS", () => {
  it("finds each defined plan by id", () => {
    for (const plan of PLANS) {
      expect(getPlan(plan.id)?.id).toBe(plan.id);
    }
  });

  it("every plan has a positive price and period -- a zero here would mean free access or an infinite plan", () => {
    for (const plan of PLANS) {
      expect(plan.priceGHS).toBeGreaterThan(0);
      expect(plan.periodDays).toBeGreaterThan(0);
    }
  });
});

describe("applyPlanOverrides", () => {
  it("replaces only the overridden plan's price, leaving the rest at defaults", () => {
    const merged = applyPlanOverrides(PLANS, [{ plan: "pro", priceGHS: 200 }]);
    expect(merged.find((p) => p.id === "pro")?.priceGHS).toBe(200);
    expect(merged.find((p) => p.id === "weekly")?.priceGHS).toBe(PLANS.find((p) => p.id === "weekly")?.priceGHS);
  });

  it("overrides duration independently of price", () => {
    const merged = applyPlanOverrides(PLANS, [{ plan: "weekly", periodDays: 10 }]);
    const weekly = merged.find((p) => p.id === "weekly");
    expect(weekly?.periodDays).toBe(10);
    expect(weekly?.priceGHS).toBe(PLANS.find((p) => p.id === "weekly")?.priceGHS);
  });

  it("carries the hidden flag through", () => {
    const merged = applyPlanOverrides(PLANS, [{ plan: "correct_score", hidden: true }]);
    expect(merged.find((p) => p.id === "correct_score")?.hidden).toBe(true);
    expect(merged.find((p) => p.id === "weekly")?.hidden).toBeFalsy();
  });

  it("ignores zero/negative/null price and period rather than breaking a plan", () => {
    const merged = applyPlanOverrides(PLANS, [{ plan: "elite", priceGHS: 0, periodDays: null }]);
    const elite = merged.find((p) => p.id === "elite");
    const defaults = PLANS.find((p) => p.id === "elite");
    expect(elite?.priceGHS).toBe(defaults?.priceGHS);
    expect(elite?.periodDays).toBe(defaults?.periodDays);
  });

  it("returns defaults untouched with no overrides", () => {
    expect(applyPlanOverrides(PLANS, [])).toEqual(PLANS);
  });

  it("does not mutate the input array", () => {
    const before = PLANS.map((p) => p.priceGHS);
    applyPlanOverrides(PLANS, [{ plan: "weekly", priceGHS: 999 }]);
    expect(PLANS.map((p) => p.priceGHS)).toEqual(before);
  });
});
