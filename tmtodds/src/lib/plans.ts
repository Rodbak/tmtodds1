export type PlanId = "weekly" | "pro" | "elite" | "correct_score";
export type Tier = "free" | PlanId;

export type PlanDef = {
  id: PlanId;
  title: string;
  subtitle: string;
  tag: string;
  priceGHS: number;
  periodDays: number;
  periodLabel: string;
  features: string[];
  mostPopular?: boolean;
};

// Single source of truth for pricing and access. The VIP tab renders
// from this list, the admin panel's tier picker uses it, and the
// Paystack routes look up amount + duration from it — so the price
// charged and the price displayed can never drift apart.
export const PLANS: PlanDef[] = [
  {
    id: "weekly",
    title: "TMT Weekly Access",
    subtitle: "7 days",
    tag: "Weekly",
    priceGHS: 70,
    periodDays: 7,
    periodLabel: "/week",
    features: ["Full daily picks board", "Members' lounge access"],
  },
  {
    id: "pro",
    title: "TMT Pro Analysis",
    subtitle: "7 days",
    tag: "Pro analysis",
    priceGHS: 150,
    periodDays: 7,
    periodLabel: "/week",
    features: ["Everything in Weekly", "In-depth daily analysis", "Priority lounge channels"],
    mostPopular: true,
  },
  {
    id: "elite",
    title: "TMT Elite",
    subtitle: "30 days",
    tag: "All access",
    priceGHS: 500,
    periodDays: 30,
    periodLabel: "/month",
    features: ["Everything in Pro, all month", "Best value for regulars"],
  },
  {
    id: "correct_score",
    title: "TMT Correct Score",
    subtitle: "30 days",
    tag: "Correct score",
    priceGHS: 1000,
    periodDays: 30,
    periodLabel: "/month",
    features: ["Everything in Elite", "In-depth correct-score analysis"],
  },
];

export function getPlan(id: PlanId): PlanDef | undefined {
  return PLANS.find((p) => p.id === id);
}

export function ghsToPesewas(ghs: number): number {
  return Math.round(ghs * 100);
}

// Tiers stack: each plan includes everything below it, same as the
// original pricing table (Pro includes Weekly, Elite includes Pro, etc).
export const TIER_ORDER: Tier[] = ["free", "weekly", "pro", "elite", "correct_score"];

export function planCoversTier(plan: Tier | null | undefined, tier: Tier): boolean {
  const planIdx = plan ? TIER_ORDER.indexOf(plan) : 0;
  const tierIdx = TIER_ORDER.indexOf(tier);
  if (planIdx === -1 || tierIdx === -1) return false;
  return planIdx >= tierIdx;
}

// A plan is active only if it hasn't passed its expiry timestamp —
// Mobile Money payments on Paystack are one-time charges, not
// auto-renewing card subscriptions, so expiry is tracked by us.
export function isPlanActive(plan: Tier | null | undefined, planExpiresAt: string | null | undefined): boolean {
  if (!plan || plan === "free") return false;
  if (!planExpiresAt) return false;
  return new Date(planExpiresAt).getTime() > Date.now();
}
