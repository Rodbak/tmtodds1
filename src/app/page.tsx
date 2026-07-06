"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useApp } from "./store/AppProvider";
import { AuthModal } from "@/components/AuthModal";
import { BottomNav } from "@/components/BottomNav";
import { HomeTab } from "@/components/HomeTab";
import { SlipsTab } from "@/components/SlipsTab";
import { ProofTab } from "@/components/ProofTab";
import { VipTab } from "@/components/VipTab";
import { ChatTab } from "@/components/ChatTab";

export default function AppShell() {
  const { tab, setTab, slipItems } = useApp();
  const [showAuth, setShowAuth] = useState(false);

  const slipTotalOdds = slipItems.reduce((acc, item) => acc * item.odds, 1);

  return (
    <div className="phone-shell flex flex-col">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* Status bar */}
      <div className="h-[52px] flex-shrink-0 flex items-end justify-between px-7 pb-1.5 z-20 bg-bg-primary">
        <span className="font-archivo font-bold text-[15px] text-text-primary">9:41</span>
        <div className="flex items-center gap-1.5 text-text-primary text-[15px]">
          <span className="text-xs">5G</span>
          <span className="text-xs">●●●</span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {tab === "home" && <HomeTab onShowAuth={() => setShowAuth(true)} />}
        {tab === "slips" && <SlipsTab />}
        {tab === "proof" && <ProofTab />}
        {tab === "vip" && <VipTab onShowAuth={() => setShowAuth(true)} />}
        {tab === "chat" && <ChatTab onShowAuth={() => setShowAuth(true)} />}
      </div>

      {/* Betslip bar - shown on home/slips tabs */}
      {(tab === "home" || tab === "slips") && slipItems.length > 0 && (
        <div className="flex-shrink-0 mx-4 mb-2 bg-accent-lime rounded-[15px] p-3 flex items-center justify-between">
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
      )}

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}
