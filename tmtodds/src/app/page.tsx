"use client";

import { useState } from "react";
import {
  House,
  ListChecks,
  ShieldCheck,
  Crown,
  MessageCircle,
  Zap,
  Lock,
} from "lucide-react";
import { useApp } from "@/app/store/AppProvider";
import type { Tab } from "@/app/store/AppContext";
import { PLANS, isPlanActive, type PlanId } from "@/lib/plans";
import { formatKickoff } from "@/lib/format";

import AuthModal from "@/components/AuthModal";
import StatCard from "@/components/StatCard";
import FormBadge from "@/components/FormBadge";
import TierCard from "@/components/TierCard";
import LedgerRow from "@/components/LedgerRow";
import ChatMessage from "@/components/ChatMessage";
import PickCard from "@/components/PickCard";
import Brand from "@/components/Brand";
import AccountControls from "@/components/AccountControls";
import BetSlipBar from "@/components/BetSlipBar";
import ChatComposer from "@/components/ChatComposer";
import LeagueFilter from "@/components/LeagueFilter";
import SegmentedFilter from "@/components/SegmentedFilter";
import SkeletonCard from "@/components/SkeletonCard";
import ImageWithFallback from "@/components/ImageWithFallback";

const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "Home", icon: House },
  { id: "slips", label: "Slips", icon: ListChecks },
  { id: "proof", label: "Proof", icon: ShieldCheck },
  { id: "vip", label: "VIP", icon: Crown },
  { id: "chat", label: "Chat", icon: MessageCircle },
];

const PLAN_STYLE: Record<PlanId, { tagColor: string; ctaStyle: string; borderColor: string; gradient?: string }> = {
  weekly: { tagColor: "text-accent-lime", ctaStyle: "border border-white/16 text-text-primary", borderColor: "border-border-subtle" },
  pro: { tagColor: "text-accent-cyan", ctaStyle: "bg-accent-lime text-bg-primary", borderColor: "border-accent-lime", gradient: "bg-gradient-to-br from-[#1a2410] to-bg-secondary" },
  elite: { tagColor: "text-text-secondary", ctaStyle: "border border-white/16 text-text-primary", borderColor: "border-border-subtle" },
  correct_score: { tagColor: "text-accent-gold", ctaStyle: "bg-accent-gold text-bg-primary", borderColor: "border-border-gold" },
};

const CHANNELS = [
  { id: "fixed-vip", label: "fixed-vip", locked: true },
  { id: "announcements", label: "announcements", locked: false },
  { id: "general", label: "general", locked: false },
  { id: "correct_score", label: "correct-score", locked: true },
];

export default function AppShell() {
  const {
    tab, setTab,
    profile,
    todayPicks, picksLoading, toggleSlip, slipItems,
    stats, ledgerLoading, ledgerFilter, setLedgerFilter, filteredLedger,
    chatMessages, chatLocked, chatLoading, activeChannel, setActiveChannel, sendMessage, pinnedMessage,
    startCheckout, checkoutLoading, checkoutError,
    leagueFilter, setLeagueFilter, filteredTodayPicks,
  } = useApp();

  const [showAuth, setShowAuth] = useState(false);
  const [ledgerExpanded, setLedgerExpanded] = useState(false);
  const [chatText, setChatText] = useState("");
  const [chatError, setChatError] = useState("");

  const slipTotalOdds = slipItems.reduce((acc, item) => acc * item.odds, 1);
  const isInSlip = (id: string) => slipItems.some((i) => i.pickId === id);

  const freePick = filteredTodayPicks.find((p) => p.tier === "free");
  const recentForm = filteredLedger
    .filter((p) => p.status === "won" || p.status === "lost" || p.status === "void")
    .slice(0, 7)
    .reverse();

  const visibleLedger = ledgerExpanded ? filteredLedger : filteredLedger.slice(0, 8);

  const allLeagues = Array.from(new Set(todayPicks.map((p) => p.league)));

  const handleSend = async () => {
    const text = chatText.trim();
    if (!text) return;
    setChatText("");
    setChatError("");
    const res = await sendMessage(text);
    if (!res.ok) {
      setChatError(res.error ?? "Message failed to send");
      setChatText(text);
    }
  };

  const handleChannelChange = (channelId: string) => {
    setActiveChannel(channelId);
    setChatText("");
    setChatError("");
  };

  return (
    <div className="min-h-dvh md:h-dvh flex flex-col md:flex-row bg-bg-primary">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:flex-shrink-0 md:h-dvh border-r border-border-subtle bg-bg-secondary/30">
        <div className="px-5 py-6">
          <Brand />
        </div>
        <nav className="flex-1 px-3 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = tab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] font-archivo font-bold text-[14px] transition-colors ${isActive ? "bg-accent-lime text-bg-primary" : "text-text-secondary hover:bg-white/5"}`}
              >
                <Icon size={19} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border-subtle">
          <AccountControls compact={false} onRequestAuth={() => setShowAuth(true)} />
        </div>
      </aside>

      {/* Right column */}
      <div className="flex-1 flex flex-col min-h-dvh md:min-h-0 md:h-dvh">
        {/* Mobile top bar */}
        <div className="md:hidden flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <Brand size="sm" />
          <AccountControls compact onRequestAuth={() => setShowAuth(true)} />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {tab === "home" && (
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div className="max-w-2xl mx-auto pb-4 md:py-6">
                {/* Hero */}
                <div className="relative mx-4 rounded-[24px] overflow-hidden h-[196px] md:h-[220px] bg-[repeating-linear-gradient(135deg,#15181F_0_14px,#191D26_14px_28px)]">
                  <ImageWithFallback
                    src="/messi.png"
                    alt="Hero"
                    className="absolute inset-0 w-full h-full opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-[rgba(11,12,15,0.05)] via-[rgba(11,12,15,0.55)] to-bg-primary" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/45 border border-white/14 rounded-[20px] px-2.5 py-1 backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse-live" />
                    <span className="font-archivo font-extrabold text-[10px] tracking-wider uppercase text-white">{todayPicks.length} picks live today</span>
                  </div>
                  <div className="absolute left-0 right-0 bottom-0 p-5">
                    <div className="font-archivo font-extrabold text-[11px] tracking-widest uppercase text-accent-lime mb-1.5">
                      Ghana · Football · Daily
                    </div>
                    <h1 className="font-anton text-[43px] leading-[0.9] text-text-primary uppercase">
                      Ghana&apos;s #1{" "}
                      <br />
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
                  <span className="font-archivo font-extrabold text-[12px] tracking-widest uppercase text-text-secondary">
                    Free pick of the day
                  </span>
                  <span className="font-archivo font-extrabold text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-[6px] bg-white/8 text-[#B8C0CC]">
                    Free zone
                  </span>
                </div>
                {freePick ? (
                  <div className="mx-4 bg-bg-secondary border border-border-subtle rounded-[16px] p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-archivo font-bold text-[11px] text-text-secondary">{freePick.league}</span>
                      <span className="font-mono text-[11px] text-text-muted">{formatKickoff(freePick.kickoffAt)}</span>
                    </div>
                    <div className="font-archivo font-extrabold text-[19px] text-text-primary mb-3">{freePick.fixture}</div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="font-archivo font-bold text-[13px] text-accent-lime">{freePick.market}</div>
                      </div>
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
                  <span className="font-archivo font-extrabold text-[12px] tracking-widest uppercase text-text-secondary">
                    Recent form
                  </span>
                  <button onClick={() => setTab("proof")} className="font-archivo font-bold text-[11px] text-accent-lime">See proof →</button>
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
                    <Zap size={19} className="text-bg-primary" />
                    <span className="font-archivo font-extrabold text-[15px] tracking-wide text-bg-primary">
                      Unlock VIP packages
                    </span>
                  </button>
                  <div className="text-center font-archivo font-medium text-[11px] text-text-muted mt-3">
                    18+ only · Gambling can be addictive · Play responsibly
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "slips" && (
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div className="max-w-2xl mx-auto pb-4 md:py-6">
                <div className="flex items-center justify-between px-5 py-2">
                  <h2 className="font-anton text-[26px] tracking-wider text-text-primary uppercase">Today&apos;s board</h2>
                  <div className="flex items-center gap-1.5 bg-[rgba(255,77,77,0.13)] rounded-[20px] px-2.5 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse-live" />
                    <span className="font-archivo font-extrabold text-[10px] text-accent-red">LIVE</span>
                  </div>
                </div>
                <p className="font-archivo font-medium text-[12px] text-text-secondary px-5 mb-3">
                  Each row mirrors a sportsbook line: fixture, market, odds.
                </p>

                {allLeagues.length > 0 && (
                  <div className="px-4 mb-3">
                    <LeagueFilter selected={leagueFilter} onSelect={setLeagueFilter} leagues={["all", ...allLeagues]} />
                  </div>
                )}

                <div className="px-4 flex flex-col gap-2.5">
                  {picksLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                  ) : filteredTodayPicks.length === 0 ? (
                    <div className="text-center py-8"><span className="font-archivo text-[12px] text-text-muted">No picks posted yet today — check back soon.</span></div>
                  ) : (
                    filteredTodayPicks.map((p) => (
                      <PickCard key={p.id} pick={p} addedToSlip={isInSlip(p.id)} onToggle={() => toggleSlip(p.id)} />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "proof" && (
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div className="max-w-2xl mx-auto pb-4 md:py-6">
                <div className="flex items-center gap-2 px-5 py-2">
                  <ShieldCheck size={22} className="text-accent-lime" />
                  <h2 className="font-anton text-[26px] tracking-wider text-text-primary uppercase">Proof & results</h2>
                </div>
                <p className="font-archivo font-medium text-[12px] text-text-secondary px-5 mb-4 leading-snug">
                  Every pick logged with its outcome. Win, lose, or void — nothing hidden.
                </p>

                {/* Win rate hero */}
                <div className="mx-4 rounded-[20px] p-5 bg-gradient-to-br from-[#1a2410] to-bg-secondary border border-border-lime relative overflow-hidden">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="font-archivo font-extrabold text-[10px] tracking-widest uppercase text-accent-lime mb-2">
                        Last 30 days
                      </div>
                      {stats?.winRate30 != null ? (
                        <>
                          <div className="font-mono font-extrabold text-[60px] leading-[0.82] text-text-primary">
                            {stats.winRate30}<span className="text-[30px] text-accent-lime">%</span>
                          </div>
                          <div className="font-archivo font-semibold text-[12px] text-text-secondary mt-2">
                            {stats.wonLast30} won · {stats.lostLast30} lost · settled picks
                          </div>
                        </>
                      ) : (
                        <div className="font-archivo font-semibold text-[14px] text-text-secondary py-3 max-w-[220px]">
                          No settled picks in the last 30 days yet.
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1 pb-1">
                      <div className="font-mono font-extrabold text-[24px] text-accent-green">{stats && stats.streak > 0 ? `W${stats.streak}` : "—"}</div>
                      <div className="font-archivo font-bold text-[9px] tracking-widest uppercase text-text-muted">streak</div>
                    </div>
                  </div>
                </div>

                {/* Segmented filter */}
                <div className="px-4 pt-3">
                  <SegmentedFilter
                    options={["all", "won", "lost", "pending"]}
                    selected={ledgerFilter}
                    onSelect={(val) => setLedgerFilter(val as "all" | "won" | "lost" | "pending")}
                  />
                </div>

                {/* Ledger */}
                <div className="px-4 flex flex-col gap-2 pt-3">
                  {ledgerLoading ? (
                    <div className="text-center py-8"><span className="font-archivo text-[12px] text-text-muted">Loading results…</span></div>
                  ) : filteredLedger.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="font-archivo text-[12px] text-text-muted">No settled picks yet. Once picks are posted and settled, every result shows up here.</span>
                    </div>
                  ) : (
                    visibleLedger.map((p) => <LedgerRow key={p.id} pick={p} />)
                  )}
                </div>
                {!ledgerLoading && filteredLedger.length > visibleLedger.length && (
                  <div className="text-center py-4">
                    <button onClick={() => setLedgerExpanded(true)} className="font-archivo font-bold text-[12px] text-accent-lime">
                      Show all {filteredLedger.length} results →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "vip" && (
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div className="max-w-3xl mx-auto pb-4 md:py-6">
                <div className="flex items-center gap-2 px-5 py-2">
                  <Crown size={22} className="text-accent-lime" />
                  <h2 className="font-anton text-[26px] tracking-wider text-text-primary uppercase">VIP packages</h2>
                </div>
                <p className="font-archivo font-medium text-[12px] text-text-secondary px-5 mb-4 leading-snug">
                  Pick a tier. Unlock the board, the picks, and the members&apos; lounge.
                </p>
                {checkoutError && <p className="px-5 text-accent-red text-[12px] font-archivo mb-3">{checkoutError}</p>}

                <div className="px-4 flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
                  {PLANS.map((plan) => {
                    const style = PLAN_STYLE[plan.id];
                    const isCurrent = profile?.plan === plan.id && isPlanActive(profile?.plan, profile?.planExpiresAt);
                    return (
                      <div key={plan.id} className={plan.mostPopular ? "relative h-full" : "h-full"}>
                        {plan.mostPopular && (
                          <div className="absolute -top-2.5 left-4 bg-accent-lime rounded-[6px] px-2 py-0.5 font-archivo font-extrabold text-[9px] tracking-wider uppercase text-bg-primary z-10">
                            Most popular
                          </div>
                        )}
                        <TierCard
                          plan={plan}
                          style={style}
                          isCurrent={isCurrent}
                          loading={checkoutLoading}
                          onClick={() => (profile ? startCheckout(plan.id) : setShowAuth(true))}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === "chat" && (
            <div className="h-full flex flex-col">
              <div className="max-w-2xl w-full mx-auto flex flex-col h-full">
                {/* Lounge header */}
                <div className="flex-shrink-0 px-5 pb-4 border-b border-border-subtle">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[10px] bg-accent-lime flex items-center justify-center">
                        <Zap size={18} className="text-bg-primary" />
                      </div>
                      <div>
                        <div className="font-anton text-[18px] text-text-primary tracking-wider uppercase">TMT VIP LOUNGE</div>
                      </div>
                    </div>
                    <MessageCircle size={23} className="text-text-secondary" />
                  </div>
                  {/* Channel pills */}
                  <div className="flex gap-1.5 mt-4 overflow-x-auto scrollbar-hide">
                    {CHANNELS.map((c) => {
                      const active = activeChannel === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => handleChannelChange(c.id)}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] font-archivo font-extrabold text-[11px] ${active ? "bg-accent-lime text-bg-primary" : "bg-bg-secondary border border-border-subtle text-text-secondary"}`}
                        >
                          {c.locked ? <Lock size={11} className={active ? "" : "text-accent-gold"} /> : <MessageCircle size={11} />}
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pinned message */}
                {pinnedMessage && !chatLocked && (
                  <div className="flex-shrink-0 px-4 pt-3">
                    <div className="bg-[rgba(204,255,51,0.07)] border border-border-lime rounded-[13px] p-3 flex gap-3">
                      <Lock size={14} className="text-accent-lime mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-archivo font-extrabold text-[11px] text-accent-lime mb-1">Pinned by admin</div>
                        <div className="font-archivo font-medium text-[12px] text-text-secondary leading-snug">{pinnedMessage.body}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chat scroll */}
                <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-4">
                  {chatLoading ? (
                    <div className="text-center py-8"><span className="font-archivo text-[12px] text-text-muted">Loading messages…</span></div>
                  ) : chatLocked ? (
                    <div className="text-center py-10">
                      <Lock size={22} className="text-accent-gold mx-auto mb-3" />
                      <p className="font-archivo font-semibold text-[13px] text-text-secondary mb-3">This channel is part of a higher tier.</p>
                      <button onClick={() => setTab("vip")} className="font-archivo font-bold text-[12px] text-accent-lime">See VIP packages →</button>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="text-center py-10"><span className="font-archivo text-[12px] text-text-muted">No messages yet — be the first to say something.</span></div>
                  ) : (
                    chatMessages.map((m) => <ChatMessage key={m.id} message={m} />)
                  )}
                </div>

                {/* Composer */}
                <ChatComposer
                  chatText={chatText}
                  onChatTextChange={setChatText}
                  onSend={handleSend}
                  chatError={chatError}
                  profile={profile}
                  chatLocked={chatLocked}
                  activeChannel={activeChannel}
                  onRequestAuth={() => setShowAuth(true)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Betslip bar - shown on home/slips tabs */}
        {(tab === "home" || tab === "slips") && slipItems.length > 0 && (
          <BetSlipBar slipItems={slipItems} slipTotalOdds={slipTotalOdds} />
        )}

        {/* Mobile bottom nav */}
        <div className="md:hidden flex-shrink-0 flex items-center justify-around px-2 pb-3 pt-2 bg-[rgba(11,12,15,0.92)] backdrop-blur-lg border-t border-border-subtle z-20 safe-bottom">
          {NAV_ITEMS.map((item) => {
            const isActive = tab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className="flex flex-col items-center gap-1 flex-1"
              >
                <Icon size={21} className={isActive ? "text-accent-lime" : "text-text-muted"} />
                <span className={`font-archivo text-[9px] tracking-wider uppercase ${isActive ? "font-extrabold text-accent-lime" : "font-bold text-text-muted"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
