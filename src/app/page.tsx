"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useApp } from "./store/AppProvider";
import { AuthModal } from "@/components/AuthModal";
import { BottomNav } from "@/components/BottomNav";
import { Sidebar } from "@/components/Sidebar";
import { HomeTab } from "@/components/HomeTab";
import { SlipsTab } from "@/components/SlipsTab";
import { ProofTab } from "@/components/ProofTab";
import { VipTab } from "@/components/VipTab";
import { ChatTab } from "@/components/ChatTab";

export default function AppShell() {
  const { tab, setTab, slipItems } = useApp();
  const [showAuth, setShowAuth] = useState(false);

  const slipTotalOdds = slipItems.reduce((acc, item) => acc * item.odds, 1);
  const showBetslip = (tab === "home" || tab === "slips") && slipItems.length > 0;

  return (
    <div className="lg:flex lg:min-h-dvh">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <Sidebar onShowAuth={() => setShowAuth(true)} />

      <div className="phone-shell flex flex-col pt-3 lg:flex-1 lg:pt-0 lg:relative">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {tab === "home" && <HomeTab onShowAuth={() => setShowAuth(true)} />}
          {tab === "slips" && <SlipsTab />}
          {tab === "proof" && <ProofTab />}
          {tab === "vip" && <VipTab onShowAuth={() => setShowAuth(true)} />}
          {tab === "chat" && <ChatTab onShowAuth={() => setShowAuth(true)} />}
        </div>

        {/* Betslip bar - shown on home/slips tabs, docked bottom-right on desktop */}
        {showBetslip && (
          <div className="flex-shrink-0 mx-4 mb-2 lg:absolute lg:bottom-6 lg:right-6 lg:mx-0 lg:mb-0 lg:w-[280px] lg:shadow-2xl lg:shadow-black/40 bg-accent-lime rounded-[15px] p-3 flex items-center justify-between">
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
    </div>
  );
}
