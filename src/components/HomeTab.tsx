"use client";

import Link from "next/link";
import { Zap, UserCircle, LogIn, LogOut, Settings, Check } from "lucide-react";
import { useApp } from "@/app/store/AppProvider";
import { formatKickoff } from "@/lib/format";
import { StatCard, FormBadge } from "./shared";

export function HomeTab({ onShowAuth }: { onShowAuth: () => void }) {
  const { profile, logout, todayPicks, ledger, stats, setTab } = useApp();

  const freePick = todayPicks.find((p) => p.tier === "free");
  const recentForm = ledger
    .filter((p) => p.status === "won" || p.status === "lost" || p.status === "void")
    .slice(0, 7)
    .reverse();

  return (
    <div className="px-4 pb-4">
      {/* App bar */}
      <div className="flex items-center justify-between px-5 py-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-accent-lime flex items-center justify-center">
            <Zap size={16} className="text-bg-primary" />
          </div>
          <span className="font-anton text-[20px] tracking-wider text-text-primary uppercase">TMTODDS</span>
        </div>
        <div className="flex items-center gap-3">
          {profile?.role === "admin" && (
            <Link href="/admin" className="text-text-secondary">
              <Settings size={19} />
            </Link>
          )}
          {profile ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-text-secondary border border-white/16 rounded-[20px] px-2 py-0.5">{profile.name}</span>
              <button onClick={logout} className="text-text-secondary">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button onClick={onShowAuth} className="flex items-center gap-1 text-accent-lime">
              <LogIn size={20} />
            </button>
          )}
          <UserCircle size={27} className="text-text-secondary" />
        </div>
      </div>

      {/* Hero */}
      <div className="relative mx-4 rounded-[24px] overflow-hidden h-[196px] bg-[repeating-linear-gradient(135deg,#15181F_0_14px,#191D26_14px_28px)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(11,12,15,0.05)] via-[rgba(11,12,15,0.55)] to-bg-primary" />
        <div className="absolute top-3 right-3 font-mono text-[9px] text-text-muted">[ PLAYER PHOTO ]</div>
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/45 border border-white/14 rounded-[20px] px-2.5 py-1 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse-live" />
          <span className="font-archivo font-extrabold text-[10px] tracking-wider uppercase text-white">{todayPicks.length} picks live today</span>
        </div>
        <div className="absolute left-0 right-0 bottom-0 p-5">
          <div className="font-archivo font-extrabold text-[11px] tracking-widest uppercase text-accent-lime mb-1.5">Ghana · Football · Daily</div>
          <h1 className="font-anton text-[43px] leading-[0.9] text-text-primary uppercase">
            Ghana&apos;s #1 <br />
            betting <span className="text-accent-lime">slips</span>
          </h1>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-2 p-4 pb-1">
        <StatCard value={stats?.winRate30 != null ? `${stats.winRate30}%` : "—"} label="Win rate · 30d" color="text-accent-lime" />
        <StatCard value={stats ? String(stats.totalDelivered) : "—"} label="Picks posted" color="text-text-primary" />
        <StatCard value={stats && stats.streak > 0 ? `W${stats.streak}` : "—"} label="Win streak" color="text-accent-green" />
      </div>

      {/* Free pick */}
      <div className="px-5 pt-5 pb-1.5 flex items-center justify-between">
        <span className="font-archivo font-extrabold text-[12px] tracking-widest uppercase text-text-secondary">Free pick of the day</span>
        <span className="font-archivo font-extrabold text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-[6px] bg-white/8 text-[#B8C0CC]">Free zone</span>
      </div>
      {freePick ? (
        <div className="mx-4 bg-bg-secondary border border-border-subtle rounded-[16px] p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-archivo font-bold text-[11px] text-text-secondary">{freePick.league}</span>
            <span className="font-mono text-[11px] text-text-muted">{formatKickoff(freePick.kickoffAt)}</span>
          </div>
          <div className="font-archivo font-extrabold text-[19px] text-text-primary mb-3">{freePick.fixture}</div>
          <div className="flex items-end justify-between">
            <div className="font-archivo font-bold text-[13px] text-accent-lime">{freePick.market}</div>
            <div className="text-right">
              <div className="font-mono font-extrabold text-[22px] leading-none text-text-primary">{freePick.odds?.toFixed(2)}</div>
              <div className="font-archivo font-bold text-[8px] tracking-widest text-text-muted mt-0.5">ODDS</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-4 bg-bg-secondary border border-border-subtle rounded-[16px] p-5 text-center">
          <span className="font-archivo font-medium text-[12px] text-text-secondary">No free pick posted yet today — check back soon.</span>
        </div>
      )}

      {/* Recent form */}
      <div className="px-5 pt-5 pb-1.5 flex items-center justify-between">
        <span className="font-archivo font-extrabold text-[12px] tracking-widest uppercase text-text-secondary">Recent form</span>
        <button onClick={() => setTab("proof")} className="font-archivo font-bold text-[11px] text-accent-lime">
          See proof →
        </button>
      </div>
      {recentForm.length > 0 ? (
        <div className="flex gap-1.5 px-4">
          {recentForm.map((p) => (
            <FormBadge
              key={p.id}
              letter={p.status === "won" ? "W" : p.status === "lost" ? "L" : "·"}
              variant={p.status === "won" ? "win" : p.status === "lost" ? "loss" : "draw"}
            />
          ))}
        </div>
      ) : (
        <div className="px-5">
          <span className="font-archivo font-medium text-[11px] text-text-muted">No settled picks yet.</span>
        </div>
      )}

      {/* CTA */}
      <div className="p-4 pt-5">
        <button onClick={() => setTab("vip")} className="w-full bg-accent-lime rounded-[15px] p-4 flex items-center justify-center gap-2">
          <Check size={19} className="text-bg-primary" />
          <span className="font-archivo font-extrabold text-[15px] tracking-wide text-bg-primary">Unlock VIP packages</span>
        </button>
        <div className="text-center font-archivo font-medium text-[11px] text-text-muted mt-3">18+ only · Gambling can be addictive · Play responsibly</div>
      </div>
    </div>
  );
}
