"use client";

import { useApp } from "@/app/store/AppProvider";
import { PickCard } from "./shared";

export function SlipsTab() {
  const { todayPicks, picksLoading, toggleSlip, slipItems } = useApp();
  const isInSlip = (id: string) => slipItems.some((i) => i.pickId === id);

  return (
    <div className="pb-4 lg:pb-10 lg:px-8 lg:content-max">
      <div className="flex items-center justify-between px-5 py-2 lg:px-0 lg:pt-6">
        <h2 className="font-anton text-[26px] tracking-wider text-text-primary uppercase">Today&apos;s board</h2>
        <div className="flex items-center gap-1.5 bg-[rgba(255,77,77,0.13)] rounded-[20px] px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse-live" />
          <span className="font-archivo font-extrabold text-[10px] text-accent-red">LIVE</span>
        </div>
      </div>
      <p className="font-archivo font-medium text-[12px] text-text-secondary px-5 mb-3 lg:px-0 lg:mb-5">Each row mirrors a sportsbook line: fixture, market, odds.</p>

      <div className="px-4 flex flex-col gap-2.5 lg:px-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3">
        {picksLoading ? (
          <div className="text-center py-8 lg:col-span-full">
            <span className="font-archivo text-[12px] text-text-muted">Loading today&apos;s picks…</span>
          </div>
        ) : todayPicks.length === 0 ? (
          <div className="text-center py-8 lg:col-span-full">
            <span className="font-archivo text-[12px] text-text-muted">No picks posted yet today — check back soon.</span>
          </div>
        ) : (
          todayPicks.map((p) => <PickCard key={p.id} pick={p} addedToSlip={isInSlip(p.id)} onToggle={() => toggleSlip(p.id)} />)
        )}
      </div>
    </div>
  );
}
