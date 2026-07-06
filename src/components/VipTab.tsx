"use client";

import { Crown } from "lucide-react";
import { useApp } from "@/app/store/AppProvider";
import { PLANS, isPlanActive } from "@/lib/plans";
import { TierCard } from "./shared";

export function VipTab({ onShowAuth }: { onShowAuth: () => void }) {
  const { profile, startCheckout, checkoutLoading, checkoutError } = useApp();

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center gap-2 px-5 py-2">
        <Crown size={22} className="text-accent-lime" />
        <h2 className="font-anton text-[26px] tracking-wider text-text-primary uppercase">VIP packages</h2>
      </div>
      <p className="font-archivo font-medium text-[12px] text-text-secondary px-5 mb-4 leading-snug">
        Pick a tier. Unlock the board, the picks, and the members&apos; lounge.
      </p>
      {checkoutError && <p className="px-5 text-accent-red text-[12px] font-archivo mb-3">{checkoutError}</p>}

      <div className="flex flex-col gap-3">
        {PLANS.map((plan) => {
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
