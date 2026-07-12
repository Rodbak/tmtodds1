"use client";

import { Crown, BadgeCheck } from "lucide-react";
import { useApp } from "@/app/store/AppProvider";
import { getPlan, isPlanActive } from "@/lib/plans";
import { formatShortDate } from "@/lib/format";
import { TierCard } from "./shared";

export function VipTab({ onShowAuth }: { onShowAuth: () => void }) {
  const { profile, plans, startCheckout, checkoutLoading, checkoutError } = useApp();

  const hasActivePlan = !!profile && isPlanActive(profile.plan, profile.planExpiresAt);
  const currentPlanDef = hasActivePlan && profile?.plan ? getPlan(profile.plan) : undefined;

  return (
    <div className="px-4 pb-4 lg:px-8 lg:pb-10 lg:content-max">
      <div className="flex items-center gap-2 px-5 py-2 lg:px-0 lg:pt-6">
        <Crown size={22} className="text-accent-lime" />
        <h2 className="font-anton text-[26px] tracking-wider text-text-primary uppercase">VIP packages</h2>
      </div>
      <p className="font-archivo font-medium text-[12px] text-text-secondary px-5 mb-4 leading-snug lg:px-0 lg:mb-6">
        {hasActivePlan ? "You're covered — upgrade any time for more access." : "Pick a tier. Unlock the board, the picks, and the members' lounge."}
      </p>
      {currentPlanDef && (
        <div className="mx-4 lg:mx-0 mb-4 flex items-center gap-2.5 rounded-[14px] border border-border-lime bg-[rgba(204,255,51,0.08)] px-4 py-3">
          <BadgeCheck size={17} className="text-accent-lime flex-shrink-0" />
          <span className="font-archivo font-semibold text-[12px] text-text-secondary">
            Current plan: <span className="font-extrabold text-text-primary">{currentPlanDef.title}</span>
            {profile?.planExpiresAt && <> · active until {formatShortDate(profile.planExpiresAt)}</>}
          </span>
        </div>
      )}
      {checkoutError && <p className="px-5 text-accent-red text-[12px] font-archivo mb-3 lg:px-0">{checkoutError}</p>}

      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 xl:grid-cols-4 lg:gap-4 lg:items-start">
        {plans.filter((plan) => !plan.hidden).map((plan) => {
          const isCurrent = profile?.plan === plan.id && isPlanActive(profile?.plan, profile?.planExpiresAt);
          return (
            <div key={plan.id} className={plan.mostPopular ? "relative" : ""}>
              {plan.mostPopular && (
                <div className="absolute -top-2.5 left-4 bg-accent-lime rounded-[6px] px-2 py-0.5 font-archivo font-extrabold text-[9px] tracking-wider uppercase text-bg-primary z-10">
                  Most popular
                </div>
              )}
              <TierCard plan={plan} isCurrent={isCurrent} loading={checkoutLoading} onClick={() => (profile ? startCheckout(plan.id) : onShowAuth())} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
