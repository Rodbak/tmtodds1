"use client";

import Link from "next/link";
import { Zap, LogIn, LogOut, Settings } from "lucide-react";
import { useApp } from "@/app/store/AppProvider";
import { NAV_ITEMS } from "./meta";

/**
 * Desktop-only left rail (hidden below `lg`, where BottomNav takes
 * over instead). Same tab state as the mobile shell -- this is a
 * different presentation of the same `tab`/`setTab`, not a separate
 * router, so switching between mobile and desktop mid-session never
 * loses your place.
 */
export function Sidebar({ onShowAuth }: { onShowAuth: () => void }) {
  const { tab, setTab, profile, logout } = useApp();

  return (
    <div className="hidden lg:flex lg:w-[248px] lg:flex-shrink-0 lg:flex-col lg:h-dvh lg:sticky lg:top-0 border-r border-border-subtle bg-bg-secondary/40">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="w-8 h-8 rounded-[9px] bg-accent-lime flex items-center justify-center flex-shrink-0">
          <Zap size={17} className="text-bg-primary" />
        </div>
        <span className="font-anton text-[21px] tracking-wider text-text-primary uppercase">TMTODDS</span>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-3 pt-2">
        {NAV_ITEMS.map((item) => {
          const isActive = tab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[11px] font-archivo font-bold text-[14px] transition-colors ${
                isActive ? "bg-accent-lime text-bg-primary" : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
              }`}
            >
              <Icon size={19} />
              {item.label}
            </button>
          );
        })}

        {profile?.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-[11px] font-archivo font-bold text-[14px] text-text-secondary hover:bg-white/5 hover:text-text-primary mt-1"
          >
            <Settings size={19} />
            Admin
          </Link>
        )}
      </nav>

      <div className="px-3 pb-4 pt-3 border-t border-border-subtle">
        {profile ? (
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="min-w-0">
              <div className="font-archivo font-bold text-[13px] text-text-primary truncate">{profile.name}</div>
              <div className="font-archivo text-[11px] text-text-muted truncate">{profile.email}</div>
            </div>
            <button
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="flex-shrink-0 w-8 h-8 rounded-[9px] flex items-center justify-center text-text-secondary hover:text-accent-red hover:bg-white/5"
            >
              <LogOut size={17} />
            </button>
          </div>
        ) : (
          <button
            onClick={onShowAuth}
            className="w-full flex items-center justify-center gap-2 bg-accent-lime text-bg-primary font-archivo font-extrabold text-[13px] rounded-[11px] py-2.5"
          >
            <LogIn size={16} />
            Log in
          </button>
        )}
        <div className="flex items-center justify-center gap-2 mt-3 px-2">
          <Link href="/legal/terms" className="font-archivo text-[10px] text-text-muted hover:text-text-secondary">Terms</Link>
          <span className="text-text-muted text-[10px]">·</span>
          <Link href="/legal/privacy" className="font-archivo text-[10px] text-text-muted hover:text-text-secondary">Privacy</Link>
          <span className="text-text-muted text-[10px]">·</span>
          <Link href="/legal/responsible-gambling" className="font-archivo text-[10px] text-text-muted hover:text-text-secondary">18+</Link>
        </div>
      </div>
    </div>
  );
}
