"use client";

import { useState } from "react";
import Link from "next/link";
import {
  House,
  ListChecks,
  ShieldCheck,
  Crown,
  MessageCircle,
  Zap,
  UserCircle,
  Check,
  X,
  Minus,
  Clock,
  Lock,
  Plus,
  ArrowRight,
  Hash,
  Users,
  LogIn,
  LogOut,
  Send,
  Settings,
} from "lucide-react";
import { useApp } from "./store/AppProvider";
import type { Tab } from "./store/AppContext";
import { PLANS, isPlanActive, type PlanId, type Tier } from "@/lib/plans";
import { formatKickoff, formatClock, formatShortDate } from "@/lib/format";
import type { PickDTO, ChatMessageDTO, PickStatus } from "@/lib/types";

const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "Home", icon: House },
  { id: "slips", label: "Slips", icon: ListChecks },
  { id: "proof", label: "Proof", icon: ShieldCheck },
  { id: "vip", label: "VIP", icon: Crown },
  { id: "chat", label: "Chat", icon: MessageCircle },
];

const TIER_META: Record<Tier, { label: string; tagStyle: string }> = {
  free: { label: "Free", tagStyle: "bg-white/8 text-[#B8C0CC]" },
  weekly: { label: "Weekly", tagStyle: "bg-[rgba(204,255,51,0.14)] text-accent-lime" },
  pro: { label: "Pro analysis", tagStyle: "bg-[rgba(87,217,255,0.14)] text-accent-cyan" },
  elite: { label: "Elite", tagStyle: "bg-white/10 text-text-secondary" },
  correct_score: { label: "Correct score", tagStyle: "bg-[rgba(245,196,81,0.14)] text-accent-gold" },
};

const STATUS_META: Record<PickStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  won: { label: "WON", color: "text-accent-green", bg: "bg-[rgba(52,224,138,0.14)]", Icon: Check },
  lost: { label: "LOST", color: "text-accent-red", bg: "bg-[rgba(255,77,77,0.13)]", Icon: X },
  void: { label: "VOID", color: "text-text-muted", bg: "bg-white/8", Icon: Minus },
  pending: { label: "PENDING", color: "text-accent-gold", bg: "bg-[rgba(245,196,81,0.14)]", Icon: Clock },
};

const PLAN_STYLE: Record<PlanId, { tagColor: string; ctaStyle: string; borderColor: string; gradient?: string }> = {
  weekly: { tagColor: "text-accent-lime", ctaStyle: "border border-white/16 text-text-primary", borderColor: "border-border-subtle" },
  pro: { tagColor: "text-accent-cyan", ctaStyle: "bg-accent-lime text-bg-primary", borderColor: "border-accent-lime", gradient: "bg-gradient-to-br from-[#1a2410] to-bg-secondary" },
  elite: { tagColor: "text-text-secondary", ctaStyle: "border border-white/16 text-text-primary", borderColor: "border-border-subtle" },
  correct_score: { tagColor: "text-accent-gold", ctaStyle: "bg-accent-gold text-bg-primary", borderColor: "border-border-gold" },
};

const CHANNELS: { id: string; label: string; locked: boolean }[] = [
  { id: "announcements", label: "announcements", locked: false },
  { id: "general", label: "general", locked: false },
  { id: "correct_score", label: "correct-score", locked: true },
];

function AuthModal({ onClose }: { onClose: () => void }) {
  const { login, register } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError("");
    setInfo("");
    if (isRegister) {
      if (!name || !email || !password) {
        setError("All fields are required");
        return;
      }
      setSubmitting(true);
      const res = await register(name, email, password);
      setSubmitting(false);
      if (!res.ok) setError(res.error ?? "Could not create account");
      else if (res.message) setInfo(res.message);
      else onClose();
    } else {
      if (!email || !password) {
        setError("Email and password required");
        return;
      }
      setSubmitting(true);
      const res = await login(email, password);
      setSubmitting(false);
      if (!res.ok) setError(res.error ?? "Invalid credentials");
      else onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-bg-secondary border border-border-subtle rounded-t-[24px] sm:rounded-[24px] p-5 animate-[slideUp_200ms_ease]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-archivo font-extrabold text-[18px] text-text-primary">{isRegister ? "Create account" : "Welcome back"}</h3>
          <button onClick={onClose} className="text-text-muted text-xs">Close</button>
        </div>
        {isRegister && (
          <input className="w-full bg-bg-primary border border-border-subtle rounded-[12px] px-4 py-3 font-archivo text-[13px] text-text-primary mb-3 outline-none focus:border-accent-lime" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
        )}
        <input className="w-full bg-bg-primary border border-border-subtle rounded-[12px] px-4 py-3 font-archivo text-[13px] text-text-primary mb-3 outline-none focus:border-accent-lime" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full bg-bg-primary border border-border-subtle rounded-[12px] px-4 py-3 font-archivo text-[13px] text-text-primary mb-3 outline-none focus:border-accent-lime" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {info && <p className="text-accent-lime text-[11px] font-archivo mb-2 leading-snug">{info}</p>}
        {error && <p className="text-accent-red text-[11px] font-archivo mb-2">{error}</p>}
        <button onClick={submit} disabled={submitting} className="w-full bg-accent-lime text-bg-primary font-archivo font-extrabold text-[14px] rounded-[14px] py-3 disabled:opacity-60">
          {submitting ? "Please wait…" : isRegister ? "Sign up" : "Log in"}
        </button>
        <p className="text-center font-archivo font-medium text-[11px] text-text-muted mt-3">
          {isRegister ? "Already have an account?" : "New here?"} <button onClick={() => { setIsRegister(!isRegister); setError(""); setInfo(""); }} className="text-accent-lime">{isRegister ? "Log in" : "Create one"}</button>
        </p>
      </div>
    </div>
  );
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="flex-1 bg-bg-secondary border border-border-subtle rounded-[14px] p-3">
      <div className={`font-mono font-extrabold text-[22px] leading-none ${color}`}>{value}</div>
      <div className="font-semibold text-[10px] text-text-secondary mt-1">{label}</div>
    </div>
  );
}

function FormBadge({ letter, variant }: { letter: string; variant: "win" | "loss" | "draw" }) {
  const colors = {
    win: "bg-[rgba(52,224,138,0.14)] text-accent-green",
    loss: "bg-[rgba(255,77,77,0.13)] text-accent-red",
    draw: "bg-[rgba(245,196,81,0.16)] text-accent-gold",
  };
  return (
    <div className={`flex-1 aspect-square flex items-center justify-center rounded-[9px] font-archivo font-extrabold text-[13px] ${colors[variant]}`}>
      {letter}
    </div>
  );
}

function TierCard({
  plan,
  style,
  isCurrent,
  loading,
  onClick,
}: {
  plan: (typeof PLANS)[number];
  style: (typeof PLAN_STYLE)[PlanId];
  isCurrent: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <div className={`relative rounded-[18px] p-4 h-full flex flex-col ${style.gradient || "bg-bg-secondary"} border ${style.borderColor}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className={`font-archivo font-extrabold text-[9px] tracking-widest uppercase mb-1 ${style.tagColor}`}>{plan.tag}</div>
          <div className="font-archivo font-extrabold text-[17px] text-text-primary">{plan.title}</div>
          <div className="font-archivo font-medium text-[11px] text-text-secondary mt-0.5">{plan.subtitle}</div>
        </div>
        <div className="text-right">
          <div className="font-mono font-extrabold text-[26px] leading-none text-text-primary">₵{plan.priceGHS}</div>
          <div className="font-mono text-[9px] text-text-muted">{plan.periodLabel}</div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 mb-3 flex-1">
        {plan.features.map((f) => (
          <div key={f} className="flex items-center gap-2">
            <Check size={13} className={style.tagColor} />
            <span className="font-archivo font-medium text-[12px] text-text-secondary">{f}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onClick}
        disabled={loading || isCurrent}
        className={`w-full rounded-[12px] py-3 text-center font-archivo font-extrabold text-[14px] ${style.ctaStyle} disabled:opacity-60`}
      >
        {isCurrent ? "Current plan" : loading ? "Redirecting…" : "Subscribe"}
      </button>
    </div>
  );
}

function LedgerRow({ pick }: { pick: PickDTO }) {
  const meta = STATUS_META[pick.status];
  const Icon = meta.Icon;
  return (
    <div className="bg-bg-secondary border border-border-subtle rounded-[14px] p-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-[10px] ${meta.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={meta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-archivo font-extrabold text-[13px] text-text-primary truncate">{pick.fixture}</div>
        <div className="font-archivo font-medium text-[11px] text-text-secondary mt-0.5">{pick.market} · {formatShortDate(pick.kickoffAt)}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={`font-mono font-extrabold text-[14px] ${meta.color}`}>{meta.label}</div>
        <div className="font-mono text-[11px] text-text-muted mt-0.5">@{pick.odds?.toFixed(2)}</div>
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: ChatMessageDTO }) {
  const initial = message.authorName.charAt(0).toUpperCase();
  return (
    <div className="flex gap-3 mb-5">
      <div className={`w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0 font-archivo font-extrabold text-[14px] ${message.isAdmin ? "bg-accent-lime text-bg-primary" : "bg-[#1f2937] text-accent-cyan"}`}>
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-archivo font-extrabold text-[13px] text-text-primary">{message.authorName}</span>
          {message.isAdmin && (
            <span className="font-archivo font-extrabold text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded-[5px] bg-accent-lime text-bg-primary">Admin</span>
          )}
          <span className="font-mono text-[10px] text-text-muted">{formatClock(message.createdAt)}</span>
        </div>
        <div className="font-archivo font-medium text-[13px] text-text-secondary leading-snug">{message.body}</div>
      </div>
    </div>
  );
}

function PickCard({ pick, addedToSlip, onToggle }: { pick: PickDTO; addedToSlip: boolean; onToggle: () => void }) {
  const meta = TIER_META[pick.tier];
  const locked = pick.locked;
  return (
    <div className={`rounded-[16px] p-4 bg-bg-secondary border ${locked ? "border-border-gold" : "border-border-subtle"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-archivo font-semibold text-[11px] text-text-secondary">{pick.league} · {formatKickoff(pick.kickoffAt)}</span>
        <span className={`font-archivo font-extrabold text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-[6px] ${meta.tagStyle}`}>{meta.label}</span>
      </div>
      <div className="font-archivo font-extrabold text-[17px] text-text-primary mb-3">{pick.fixture}</div>
      <div className="flex items-end justify-between">
        <div>
          <div className={`font-archivo font-bold text-[13px] ${locked ? "text-text-muted" : "text-accent-lime"}`}>
            {locked ? "Locked pick" : pick.market}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!locked ? (
            <>
              <div className="text-right">
                <div className="font-mono font-extrabold text-[20px] leading-none text-text-primary">{pick.odds?.toFixed(2)}</div>
              </div>
              <button
                onClick={onToggle}
                className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${addedToSlip ? "bg-accent-gold text-bg-primary" : "bg-accent-lime text-bg-primary"}`}
              >
                {addedToSlip ? <Check size={17} /> : <Plus size={17} />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Lock size={15} className="text-accent-gold" />
              <div>
                <div className="font-mono font-extrabold text-[14px] text-text-muted tracking-widest">•• – ••</div>
                <div className="font-archivo font-semibold text-[11px] text-text-secondary mt-0.5">Unlock to view pick</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Branding shown in the sidebar (desktop) and top bar (mobile). */
function Brand({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "md" ? "w-8 h-8 rounded-[9px]" : "w-7 h-7 rounded-[8px]";
  const iconSize = size === "md" ? 18 : 16;
  const text = size === "md" ? "text-[21px]" : "text-[19px]";
  return (
    <div className="flex items-center gap-2">
      <div className={`${box} bg-accent-lime flex items-center justify-center flex-shrink-0`}>
        <Zap size={iconSize} className="text-bg-primary" />
      </div>
      <span className={`font-anton ${text} tracking-wider text-text-primary uppercase`}>TMTODDS</span>
    </div>
  );
}

/** Account controls: admin link + login/logout. Shared by sidebar and mobile top bar. */
function AccountControls({
  compact,
  onRequestAuth,
}: {
  compact: boolean;
  onRequestAuth: () => void;
}) {
  const { profile, logout } = useApp();

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {profile?.role === "admin" && (
          <Link href="/admin" className="text-text-secondary">
            <Settings size={19} />
          </Link>
        )}
        {profile ? (
          <button onClick={logout} className="text-text-secondary"><LogOut size={18} /></button>
        ) : (
          <button onClick={onRequestAuth} className="text-accent-lime"><LogIn size={20} /></button>
        )}
        <UserCircle size={25} className="text-text-secondary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {profile?.role === "admin" && (
        <Link
          href="/admin"
          className="flex items-center justify-center gap-2 border border-white/14 text-text-secondary rounded-[10px] py-2 font-archivo font-bold text-[13px]"
        >
          <Settings size={15} /> Admin
        </Link>
      )}
      {profile ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <UserCircle size={22} className="text-text-secondary flex-shrink-0" />
            <span className="font-archivo font-bold text-[13px] text-text-primary truncate">{profile.name}</span>
          </div>
          <button onClick={logout} className="text-text-muted flex-shrink-0"><LogOut size={17} /></button>
        </div>
      ) : (
        <button
          onClick={onRequestAuth}
          className="w-full flex items-center justify-center gap-2 bg-accent-lime text-bg-primary rounded-[10px] py-2.5 font-archivo font-bold text-[13px]"
        >
          <LogIn size={16} /> Log in
        </button>
      )}
    </div>
  );
}

export default function AppShell() {
  const {
    tab, setTab,
    profile,
    todayPicks, picksLoading, toggleSlip, slipItems,
    ledger, stats, ledgerLoading,
    chatMessages, chatLocked, chatLoading, activeChannel, setActiveChannel, sendMessage,
    startCheckout, checkoutLoading, checkoutError,
  } = useApp();

  const [showAuth, setShowAuth] = useState(false);
  const [ledgerExpanded, setLedgerExpanded] = useState(false);
  const [chatText, setChatText] = useState("");
  const [chatError, setChatError] = useState("");

  const slipTotalOdds = slipItems.reduce((acc, item) => acc * item.odds, 1);
  const isInSlip = (id: string) => slipItems.some((i) => i.pickId === id);

  const freePick = todayPicks.find((p) => p.tier === "free");
  const recentForm = ledger
    .filter((p) => p.status === "won" || p.status === "lost" || p.status === "void")
    .slice(0, 7)
    .reverse();

  const visibleLedger = ledgerExpanded ? ledger : ledger.slice(0, 8);

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
                <div className="relative mx-4 rounded-[24px] overflow-hidden h-[196px] bg-[repeating-linear-gradient(135deg,#15181F_0_14px,#191D26_14px_28px)]">
                  <div className="absolute inset-0 bg-gradient-to-b from-[rgba(11,12,15,0.05)] via-[rgba(11,12,15,0.55)] to-bg-primary" />
                  <div className="absolute top-3 right-3 font-mono text-[9px] text-text-muted">[ PLAYER PHOTO ]</div>
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
                    <Check size={19} className="text-bg-primary" />
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

                <div className="px-4 flex flex-col gap-2.5">
                  {picksLoading ? (
                    <div className="text-center py-8"><span className="font-archivo text-[12px] text-text-muted">Loading today&apos;s picks…</span></div>
                  ) : todayPicks.length === 0 ? (
                    <div className="text-center py-8"><span className="font-archivo text-[12px] text-text-muted">No picks posted yet today — check back soon.</span></div>
                  ) : (
                    todayPicks.map((p) => (
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

                {/* Ledger */}
                <div className="px-4 flex flex-col gap-2 pt-3">
                  {ledgerLoading ? (
                    <div className="text-center py-8"><span className="font-archivo text-[12px] text-text-muted">Loading results…</span></div>
                  ) : ledger.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="font-archivo text-[12px] text-text-muted">No settled picks yet. Once picks are posted and settled, every result shows up here.</span>
                    </div>
                  ) : (
                    visibleLedger.map((p) => <LedgerRow key={p.id} pick={p} />)
                  )}
                </div>
                {!ledgerLoading && ledger.length > visibleLedger.length && (
                  <div className="text-center py-4">
                    <button onClick={() => setLedgerExpanded(true)} className="font-archivo font-bold text-[12px] text-accent-lime">
                      Show all {ledger.length} results →
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
                    <Users size={23} className="text-text-secondary" />
                  </div>
                  {/* Channel pills */}
                  <div className="flex gap-1.5 mt-4 overflow-x-auto scrollbar-hide">
                    {CHANNELS.map((c) => {
                      const active = activeChannel === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setActiveChannel(c.id)}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] font-archivo font-extrabold text-[11px] ${active ? "bg-accent-lime text-bg-primary" : "bg-bg-secondary border border-border-subtle text-text-secondary"}`}
                        >
                          {c.locked ? <Lock size={11} className={active ? "" : "text-accent-gold"} /> : <Hash size={11} />}
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

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
                <div className="flex-shrink-0 px-4 pb-3 pt-2.5 border-t border-border-subtle">
                  {chatError && <p className="text-accent-red text-[11px] font-archivo mb-1.5 px-1">{chatError}</p>}
                  {!profile ? (
                    <button onClick={() => setShowAuth(true)} className="w-full text-center font-archivo font-bold text-[12px] text-accent-lime py-2">Log in to chat →</button>
                  ) : chatLocked ? null : (
                    <div className="flex items-center gap-2.5 bg-bg-secondary border border-white/10 rounded-[14px] px-4 py-2.5">
                      <input
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                        placeholder={`Message #${activeChannel}`}
                        className="flex-1 bg-transparent font-archivo font-medium text-[13px] text-text-primary outline-none placeholder:text-text-muted"
                      />
                      <button onClick={handleSend} className="w-8 h-8 rounded-[9px] bg-accent-lime flex items-center justify-center flex-shrink-0 flex-none">
                        <Send size={15} className="text-bg-primary" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Betslip bar - shown on home/slips tabs */}
        {(tab === "home" || tab === "slips") && slipItems.length > 0 && (
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
