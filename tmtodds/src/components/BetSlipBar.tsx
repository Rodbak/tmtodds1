"use client";

import { ArrowRight } from "lucide-react";

interface BetSlipBarProps {
  slipItems: { pickId: string; odds: number }[];
  slipTotalOdds: number;
}

export default function BetSlipBar({ slipItems, slipTotalOdds }: BetSlipBarProps) {
  return (
    <div className="flex-shrink-0 px-4 pb-2 pt-1">
      <div className="max-w-2xl mx-auto bg-accent-lime rounded-[15px] p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[7px] bg-bg-primary flex items-center justify-center font-mono font-extrabold text-[12px] text-accent-lime">
            {slipItems.length}
          </div>
          <span className="font-archivo font-extrabold text-[13px] text-bg-primary">In your slip</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono font-extrabold text-[15px] text-bg-primary">{slipTotalOdds.toFixed(2)}</span>
          <ArrowRight size={15} className="text-bg-primary" />
        </div>
      </div>
    </div>
  );
}