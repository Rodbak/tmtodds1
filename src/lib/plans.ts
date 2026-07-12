export type PlanId = "weekly" | "pro" | "elite" | "correct_score";
export type Tier = "free" | PlanId;

export type PlanDef = {
  id: PlanId;
  tag: string;
  title: string;
  subtitle: string;
  priceGHS: number;
  periodDays: number;
  periodLabel: string;
  features: string[];
  ctaLabel: string;
  mostPopular?: boolean;
  // Set from the plan_prices override table: a hidden plan stays out
  // of the VIP tab and can't be checked out, but isn't deleted.
  hidden?: boolean;
};

// Single source of truth for pricing and access. The VIP tab renders
// from this list, the admin panel's tier picker uses it, and the
// Paystack routes look up amount + duration from it -- so the price
// charged and the price displayed can never drift apart.
//
// Naming note: tiers are branded "Locked" rather than "Fixed" on
// purpose. In this market, "fixed match" specifically implies a
// pre-arranged result, which is both untrue of an analysis product
// and the exact language used by match-fixing scam channels --
// "Locked" keeps the same confident, vault-like feel (it pairs with
// the lock/unlock iconography used throughout the picks board) without
// that claim. See the honesty note in README.md before changing this.
export const PLANS: PlanDef[] = [
  {
    id: "weekly",
    tag: "Locked",
    title: "TMT Locked Pass",
    subtitle: "7 days · weekly",
    priceGHS: 70,
    periodDays: 7,
    periodLabel: "/week",
    features: ["Locked VIP slips", "Members' lounge access"],
    ctaLabel: "Subscribe",
  },
  {
    id: "pro",
    tag: "Locked + Confirmed",
    title: "TMT Pro Confirmed",
    subtitle: "7 days · weekly",
    priceGHS: 150,
    periodDays: 7,
    periodLabel: "/week",
    features: ["Everything in Locked", "Confirmed daily picks", "Priority lounge channels"],
    ctaLabel: "Get this plan",
    mostPopular: true,
  },
  {
    id: "elite",
    tag: "All access",
    title: "TMT Elite",
    subtitle: "30 days · monthly",
    priceGHS: 500,
    periodDays: 30,
    periodLabel: "/month",
    features: ["Locked + Confirmed, all month", "Best value for regulars"],
    ctaLabel: "Subscribe",
  },
  {
    id: "correct_score",
    tag: "Correct score · premium",
    title: "Correct Score Vault",
    subtitle: "30 days · monthly",
    priceGHS: 1000,
    periodDays: 30,
    periodLabel: "/month",
    features: ["Everything, plus correct-score vault", "Highest-odds picks (9.00+)"],
    ctaLabel: "Subscribe",
  },
];

export function getPlan(id: PlanId): PlanDef | undefined {
  return PLANS.find((p) => p.id === id);
}

export type PlanOverride = {
  plan: PlanId;
  priceGHS?: number | null;
  periodDays?: number | null;
  hidden?: boolean;
};

// Admin can change a plan's price, duration, or visibility from
// /admin without a code deploy; the override lives in the plan_prices
// table and wins over the defaults above. The VIP tab (via GET
// /api/plans), the Paystack charge (initialize), and the activation
// expiry (activateFromTransaction) all go through this same merge, so
// what's displayed, what's charged, and how long it lasts can't
// diverge. A null/absent field keeps that field's default.
export function applyPlanOverrides(plans: PlanDef[], overrides: PlanOverride[]): PlanDef[] {
  const byId = new Map(overrides.map((o) => [o.plan, o]));
  return plans.map((p) => {
    const o = byId.get(p.id);
    if (!o) return p;
    return {
      ...p,
      priceGHS: o.priceGHS != null && o.priceGHS > 0 ? o.priceGHS : p.priceGHS,
      periodDays: o.periodDays != null && o.periodDays > 0 ? o.periodDays : p.periodDays,
      hidden: o.hidden === true,
    };
  });
}

export function ghsToPesewas(ghs: number): number {
  return Math.round(ghs * 100);
}

// Tiers stack: each plan includes everything below it (Pro includes
// Locked, Elite includes Pro, Correct Score includes Elite).
export const TIER_ORDER: Tier[] = ["free", "weekly", "pro", "elite", "correct_score"];

export function planCoversTier(plan: Tier | null | undefined, tier: Tier): boolean {
  const planIdx = plan ? TIER_ORDER.indexOf(plan) : 0;
  const tierIdx = TIER_ORDER.indexOf(tier);
  if (planIdx === -1 || tierIdx === -1) return false;
  return planIdx >= tierIdx;
}

// A plan is active only if it hasn't passed its expiry timestamp --
// Mobile Money payments on Paystack are one-time charges, not
// auto-renewing card subscriptions, so expiry is tracked by us.
export function isPlanActive(plan: Tier | null | undefined, planExpiresAt: string | null | undefined): boolean {
  if (!plan || plan === "free") return false;
  if (!planExpiresAt) return false;
  return new Date(planExpiresAt).getTime() > Date.now();
}
