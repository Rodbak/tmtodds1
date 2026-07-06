"use client";

import type { Tab } from "@/app/store/AppContext";
import { NAV_ITEMS } from "./meta";

export function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <div className="flex-shrink-0 flex items-center justify-around px-2 pb-3 pt-2 bg-[rgba(11,12,15,0.92)] backdrop-blur-lg border-t border-border-subtle z-20 safe-bottom">
      {NAV_ITEMS.map((item) => {
        const isActive = tab === item.id;
        const Icon = item.icon;
        return (
          <button key={item.id} onClick={() => setTab(item.id)} className="flex flex-col items-center gap-1 flex-1">
            <Icon size={21} className={isActive ? "text-accent-lime" : "text-text-muted"} />
            <span className={`font-archivo text-[9px] tracking-wider uppercase ${isActive ? "font-extrabold text-accent-lime" : "font-bold text-text-muted"}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
