"use client";

import { useState } from "react";
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
  Clock,
  Lock,
  Plus,
  ArrowRight,
  Hash,
  Megaphone,
  Pin,
  PlusCircle,
  Send,
  Users,
  LogIn,
  LogOut,
} from "lucide-react";
import { useApp } from "./store/AppProvider";

type Tab = "home" | "slips" | "proof" | "vip" | "chat";

const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType; activeIcon: React.ElementType }[] = [
  { id: "home", label: "Home", icon: House, activeIcon: House },
  { id: "slips", label: "Slips", icon: ListChecks, activeIcon: ListChecks },
  { id: "proof", label: "Proof", icon: ShieldCheck, activeIcon: ShieldCheck },
  { id: "vip", label: "VIP", icon: Crown, activeIcon: Crown },
  { id: "chat", label: "Chat", icon: MessageCircle, activeIcon: MessageCircle },
];

function AuthModal({ onClose }: { onClose: () => void }) {
  const { login, register } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    setError("");
    if (isRegister) {
      if (!name || !email || !password) { setError("All fields are required"); return; }
      const ok = register(name, email, password);
      if (!ok) setError("Email already exists");
      else onClose();
    } else {
      if (!email || !password) { setError("Email and password required"); return; }
      const ok = login(email, password);
      if (!ok) setError("Invalid credentials");
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
        {error && <p className="text-accent-red text-[11px] font-archivo mb-2">{error}</p>}
        <button onClick={submit} className="w-full bg-accent-lime text-bg-primary font-archivo font-extrabold text-[14px] rounded-[14px] py-3">{isRegister ? "Sign up" : "Log in"}</button>
        <p className="text-center font-archivo font-medium text-[11px] text-text-muted mt-3">
          {isRegister ? "Already have an account?" : "New here?"} <button onClick={() => setIsRegister(!isRegister)} className="text-accent-lime">{isRegister ? "Log in" : "Create one"}</button>
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
  title,
  subtitle,
  tag,
  tagColor,
  price,
  period,
  features,
  cta,
  ctaStyle,
  borderColor,
  gradient,
  onClick,
}: {
  title: string;
  subtitle: string;
  tag?: string;
  tagColor?: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  ctaStyle: string;
  borderColor?: string;
  gradient?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-[18px] p-4 ${gradient || "bg-bg-secondary"} ${borderColor ? `border ${borderColor}` : "border border-border-subtle"} ${onClick ? "cursor-pointer" : ""}`}
    >
      {tag && (
        <div className={`absolute -top-2.5 left-4 rounded-[6px] px-2 py-0.5 font-archivo font-extrabold text-[9px] tracking-wider uppercase ${tagColor}`}>
          {tag}
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <div>
          {tagColor && <div className={`font-archivo font-extrabold text-[9px] tracking-widest uppercase mb-1 ${tagColor}`}>{tag}</div>}
          <div className="font-archivo font-extrabold text-[17px] text-text-primary">{title}</div>
          <div className="font-archivo font-medium text-[11px] text-text-secondary mt-0.5">{subtitle}</div>
        </div>
        <div className="text-right">
          <div className="font-mono font-extrabold text-[26px] leading-none text-text-primary">{price}</div>
          <div className="font-mono text-[9px] text-text-muted">{period}</div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 mb-3">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-2">
            <Check size={13} className={tagColor || "text-accent-lime"} />
            <span className="font-archivo font-medium text-[12px] text-text-secondary">{f}</span>
          </div>
        ))}
      </div>
      <div className={`rounded-[12px] py-3 text-center font-archivo font-extrabold text-[14px] ${ctaStyle}`}>
        {cta}
      </div>
    </div>
  );
}

function LedgerRow({
  match,
  market,
  date,
  status,
  odds,
  statusColor,
}: {
  match: string;
  market: string;
  date: string;
  status: string;
  odds: string;
  statusColor: string;
}) {
  const iconMap: Record<string, React.ElementType> = {
    WON: Check,
    LOST: X,
    PENDING: Clock,
  };
  const bgMap: Record<string, string> = {
    WON: "bg-[rgba(52,224,138,0.14)]",
    LOST: "bg-[rgba(255,77,77,0.13)]",
    PENDING: "bg-[rgba(245,196,81,0.14)]",
  };
  const Icon = iconMap[status] || Clock;
  return (
    <div className="bg-bg-secondary border border-border-subtle rounded-[14px] p-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-[10px] ${bgMap[status]} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={statusColor} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-archivo font-extrabold text-[13px] text-text-primary truncate">{match}</div>
        <div className="font-archivo font-medium text-[11px] text-text-secondary mt-0.5">{market} · {date}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={`font-mono font-extrabold text-[14px] ${statusColor}`}>{status}</div>
        <div className="font-mono text-[11px] text-text-muted mt-0.5">@{odds}</div>
      </div>
    </div>
  );
}

function ChatMessage({
  avatar,
  avatarColor,
  name,
  time,
  text,
}: {
  avatar: string;
  avatarColor: string;
  name: string;
  time: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 mb-5">
      <div className={`w-9 h-9 rounded-[11px] ${avatarColor} flex items-center justify-center flex-shrink-0 font-archivo font-extrabold text-[14px]`}>
        {avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-archivo font-extrabold text-[13px] text-text-primary">{name}</span>
          <span className="font-mono text-[10px] text-text-muted">{time}</span>
        </div>
        <div className="font-archivo font-medium text-[13px] text-text-secondary leading-snug">{text}</div>
      </div>
    </div>
  );
}

function PickCard({
  league,
  time,
  fixture,
  market,
  odds,
  tag,
  tagStyle,
  locked,
  addedToSlip,
  onToggle,
}: {
  league: string;
  time: string;
  fixture: string;
  market: string;
  odds: string;
  tag: string;
  tagStyle: string;
  locked?: boolean;
  addedToSlip?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className={`rounded-[16px] p-4 ${locked ? "bg-bg-secondary border border-border-gold" : "bg-bg-secondary border border-border-subtle"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-archivo font-semibold text-[11px] text-text-secondary">{league} · {time}</span>
        <span className={`font-archivo font-extrabold text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-[6px] ${tagStyle}`}>{tag}</span>
      </div>
      <div className="font-archivo font-extrabold text-[17px] text-text-primary mb-3">{fixture}</div>
      <div className="flex items-end justify-between">
        <div>
          <div className={`font-archivo font-bold text-[13px] ${locked ? "text-text-muted" : "text-accent-lime"}`}>{market}</div>
          {!locked && <div className="font-archivo font-medium text-[11px] text-text-secondary mt-0.5">Total goals</div>}
        </div>
        <div className="flex items-center gap-2">
          {!locked ? (
            <>
              <div className="text-right">
                <div className="font-mono font-extrabold text-[20px] leading-none text-text-primary">{odds}</div>
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

export default function AppShell() {
  const { tab, setTab, picks, toggleSlip, slipItems, user, logout } = useApp();
  const [showAuth, setShowAuth] = useState(false);

  const slipTotalOdds = slipItems.reduce((acc, item) => acc * item.odds, 1);
  const leagues = ["All", "Premier League", "UCL", "LaLiga", "Serie A"];

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
        {tab === "home" && (
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
                {user ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-text-secondary border border-white/16 rounded-[20px] px-2 py-0.5">{user.name}</span>
                    <button onClick={logout} className="text-text-secondary"><LogOut size={18} /></button>
                  </div>
                ) : (
                  <button onClick={() => setShowAuth(true)} className="flex items-center gap-1 text-accent-lime"><LogIn size={20} /></button>
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
                <span className="font-archivo font-extrabold text-[10px] tracking-wider uppercase text-white">12 slips live today</span>
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
              <StatCard value="87%" label="Win rate · 30d" color="text-accent-lime" />
              <StatCard value="200+" label="Slips delivered" color="text-text-primary" />
              <StatCard value="W7" label="Win streak" color="text-accent-green" />
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
            <div className="mx-4 bg-bg-secondary border border-border-subtle rounded-[16px] p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-archivo font-bold text-[11px] text-text-secondary">Premier League</span>
                <span className="font-mono text-[11px] text-text-muted">Sun · 15:00</span>
              </div>
              <div className="font-archivo font-extrabold text-[19px] text-text-primary mb-3">
                Arsenal <span className="text-text-muted">vs</span> Aston Villa
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="font-archivo font-bold text-[13px] text-accent-lime">Over 1.5 · Yes</div>
                  <div className="font-archivo font-medium text-[11px] text-text-secondary mt-0.5">Total goals</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-extrabold text-[22px] leading-none text-text-primary">1.35</div>
                  <div className="font-archivo font-bold text-[8px] tracking-widest text-text-muted mt-0.5">ODDS</div>
                </div>
              </div>
            </div>

            {/* Recent form */}
            <div className="px-5 pt-5 pb-1.5 flex items-center justify-between">
              <span className="font-archivo font-extrabold text-[12px] tracking-widest uppercase text-text-secondary">
                Recent form
              </span>
              <span className="font-archivo font-bold text-[11px] text-accent-lime">See proof →</span>
            </div>
            <div className="flex gap-1.5 px-4">
              <FormBadge letter="W" variant="win" />
              <FormBadge letter="W" variant="win" />
              <FormBadge letter="L" variant="loss" />
              <FormBadge letter="W" variant="win" />
              <FormBadge letter="W" variant="win" />
              <FormBadge letter="W" variant="win" />
              <FormBadge letter="··" variant="draw" />
            </div>

            {/* CTA */}
            <div className="p-4 pt-5">
              <div className="bg-accent-lime rounded-[15px] p-4 flex items-center justify-center gap-2">
                <Check size={19} className="text-bg-primary" />
                <span className="font-archivo font-extrabold text-[15px] tracking-wide text-bg-primary">
                  Unlock VIP packages
                </span>
              </div>
              <div className="text-center font-archivo font-medium text-[11px] text-text-muted mt-3">
                18+ only · Gambling can be addictive · Play responsibly
              </div>
            </div>
          </div>
        )}

        {tab === "slips" && (
          <div className="pb-4">
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
              {picks.map((p) => (
                <PickCard key={p.id} {...p} onToggle={() => toggleSlip(p.id)} />
              ))}
            </div>
          </div>
        )}

        {tab === "proof" && (
          <div className="px-4 pb-4">
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-2">
              <ShieldCheck size={22} className="text-accent-lime" />
              <h2 className="font-anton text-[26px] tracking-wider text-text-primary uppercase">Proof & results</h2>
            </div>
            <p className="font-archivo font-medium text-[12px] text-text-secondary px-5 mb-4 leading-snug">
              Every pick logged with its outcome. Win, lose, or pending — nothing hidden.
            </p>

            {/* Win rate hero */}
            <div className="mx-4 rounded-[20px] p-5 bg-gradient-to-br from-[#1a2410] to-bg-secondary border border-border-lime relative overflow-hidden">
              <div className="flex items-end justify-between">
                <div>
                  <div className="font-archivo font-extrabold text-[10px] tracking-widest uppercase text-accent-lime mb-2">
                    Verified · last 30 days
                  </div>
                  <div className="font-mono font-extrabold text-[60px] leading-[0.82] text-text-primary">
                    87<span className="text-[30px] text-accent-lime">%</span>
                  </div>
                  <div className="font-archivo font-semibold text-[12px] text-text-secondary mt-2">
                    52 won · 8 lost · settled slips
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 pb-1">
                  <div className="font-mono font-extrabold text-[24px] text-accent-green">W7</div>
                  <div className="font-archivo font-bold text-[9px] tracking-widest uppercase text-text-muted">streak</div>
                </div>
              </div>
            </div>

            {/* Ledger */}
            <div className="px-4 flex flex-col gap-2 pt-3">
              <LedgerRow match="Inter — PSG" market="BTTS · Yes · 11 May" date="" status="WON" odds="1.72" statusColor="text-accent-green" />
              <LedgerRow match="Milan — Napoli" market="Correct Score · 2-1 · 12 May" date="" status="WON" odds="9.00" statusColor="text-accent-green" />
              <LedgerRow match="Bayern — Leipzig" market="Over 2.5 · Yes · 10 May" date="" status="LOST" odds="1.55" statusColor="text-accent-red" />
              <LedgerRow match="Arsenal — Aston Villa" market="Over 1.5 · Yes · Today 15:00" date="" status="PENDING" odds="1.35" statusColor="text-accent-gold" />
              <LedgerRow match="Real Madrid — Girona" market="Home · Win · 9 May" date="" status="WON" odds="1.40" statusColor="text-accent-green" />
            </div>
            <div className="text-center py-4">
              <span className="font-archivo font-bold text-[12px] text-accent-lime">View full ledger →</span>
            </div>
          </div>
        )}

        {tab === "vip" && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 px-5 py-2">
              <Crown size={22} className="text-accent-lime" />
              <h2 className="font-anton text-[26px] tracking-wider text-text-primary uppercase">VIP packages</h2>
            </div>
            <p className="font-archivo font-medium text-[12px] text-text-secondary px-5 mb-4 leading-snug">
              Pick a tier. Unlock the board, the picks, and the members&apos; lounge.{" "}
              <span className="text-accent-gold">Demo mode — no real charge.</span>
            </p>

            <div className="flex flex-col gap-3">
              <TierCard
                title="TMT Fixed Pass"
                subtitle="7 days · weekly"
                tag="Fixed"
                tagColor="text-accent-lime"
                price="₵70"
                period="/week"
                features={["Fixed-match slips", "Members' lounge access"]}
                cta="Subscribe"
                ctaStyle="border border-white/16 rounded-[12px] text-text-primary font-extrabold"
                borderColor="border-border-subtle"
              />

              <div className="relative">
                <div className="absolute -top-2.5 left-4 bg-accent-lime rounded-[6px] px-2 py-0.5 font-archivo font-extrabold text-[9px] tracking-wider uppercase text-bg-primary z-10">
                  Most popular
                </div>
                <TierCard
                  title="TMT Pro Confirmed"
                  subtitle="7 days · weekly"
                  tag="Fixed + Confirmed"
                  tagColor="text-accent-cyan"
                  price="₵150"
                  period="/week"
                  features={["Everything in Fixed", "Confirmed daily picks", "Priority lounge channels"]}
                  cta="Get this plan"
                  ctaStyle="bg-accent-lime rounded-[12px] text-bg-primary font-extrabold"
                  borderColor="border-accent-lime"
                  gradient="bg-gradient-to-br from-[#1a2410] to-bg-secondary"
                />
              </div>

              <TierCard
                title="TMT Elite"
                subtitle="30 days · monthly"
                tag="All access"
                tagColor="text-text-secondary"
                price="₵500"
                period="/month"
                features={["Fixed + Confirmed, all month", "Best value for regulars"]}
                cta="Subscribe"
                ctaStyle="border border-white/16 rounded-[12px] text-text-primary font-extrabold"
                borderColor="border-border-subtle"
              />

              <TierCard
                title="Correct Score Vault"
                subtitle="30 days · monthly"
                tag="Correct score · premium"
                tagColor="text-accent-gold"
                price="₵1000"
                period="/month"
                features={["Everything, plus correct-score vault", "Highest-odds picks (9.00+)"]}
                cta="Subscribe"
                ctaStyle="bg-accent-gold rounded-[12px] text-bg-primary font-extrabold"
                borderColor="border-border-gold"
              />
            </div>
          </div>
        )}

        {tab === "chat" && (
          <div className="flex flex-col h-full">
            {/* Lounge header */}
            <div className="flex-shrink-0 px-5 pb-4 border-b border-border-subtle">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[10px] bg-accent-lime flex items-center justify-center">
                    <Zap size={18} className="text-bg-primary" />
                  </div>
                  <div>
                    <div className="font-anton text-[18px] text-text-primary tracking-wider uppercase">TMT VIP LOUNGE</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                      <span className="font-archivo font-semibold text-[11px] text-text-secondary">214 online</span>
                    </div>
                  </div>
                </div>
                <Users size={23} className="text-text-secondary" />
              </div>
              {/* Channel pills */}
              <div className="flex gap-1.5 mt-4 overflow-x-auto scrollbar-hide">
                <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-accent-lime font-archivo font-extrabold text-[11px] text-bg-primary">
                  <Hash size={11} />
                  fixed-vip
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-bg-secondary border border-border-subtle font-archivo font-bold text-[11px] text-text-secondary">
                  <Megaphone size={11} />
                  announcements
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-bg-secondary border border-border-subtle font-archivo font-bold text-[11px] text-text-secondary">
                  <Hash size={11} />
                  general
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-bg-secondary font-archivo font-bold text-[11px] text-text-muted">
                  <Lock size={11} className="text-accent-gold" />
                  correct-score
                </div>
              </div>
            </div>

            {/* Chat scroll */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-4">
              {/* Admin pinned */}
              <div className="bg-[rgba(204,255,51,0.07)] border border-border-lime rounded-[13px] p-3 mb-5 flex gap-2">
                <Pin size={14} className="text-accent-lime mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-archivo font-extrabold text-[11px] text-accent-lime mb-1">Pinned by admin</div>
                  <div className="font-archivo font-medium text-[12px] text-text-secondary leading-snug">Today's fixed slip drops at 12:00 GMT. Stake responsibly — 1-2 units max.</div>
                </div>
              </div>

              {/* Admin message */}
              <div className="flex gap-3 mb-5">
                <div className="w-9 h-9 rounded-[11px] bg-accent-lime flex items-center justify-center flex-shrink-0 font-archivo font-extrabold text-[14px] text-bg-primary">T</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-archivo font-extrabold text-[13px] text-text-primary">TMT Admin</span>
                    <span className="font-archivo font-extrabold text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded-[5px] bg-accent-lime text-bg-primary">Admin</span>
                    <span className="font-mono text-[10px] text-text-muted">11:58</span>
                  </div>
                  <div className="font-archivo font-medium text-[13px] text-text-secondary mb-3 leading-snug">Fixed slip is in 🔒 Here's today's confirmed line — full board on the Slips tab.</div>
                  {/* Embedded slip */}
                  <div className="mt-3 bg-bg-secondary border border-border-cyan rounded-[12px] p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-archivo font-bold text-[10px] text-text-secondary">UCL · Mon 19:00</span>
                      <span className="font-archivo font-extrabold text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded-[5px] bg-[rgba(87,217,255,0.14)] text-accent-cyan">Confirmed</span>
                    </div>
                    <div className="font-archivo font-extrabold text-[14px] text-text-primary mb-2">Inter vs PSG</div>
                    <div className="flex items-center justify-between">
                      <span className="font-archivo font-bold text-[12px] text-accent-cyan">BTTS · Yes</span>
                      <span className="font-mono font-extrabold text-[16px] text-text-primary">1.72</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Member messages */}
              <ChatMessage
                avatar="K"
                avatarColor="bg-[#1f2937] text-accent-cyan"
                name="Kwame_GH"
                time="12:01"
                text="Bagged the Inter line last week 🙌 staying disciplined this time"
              />
              <ChatMessage
                avatar="A"
                avatarColor="bg-[#1f2937] text-accent-gold"
                name="Ama_Accra"
                time="12:03"
                text="Is correct-score channel unlocking for Elite this week?"
              />

              {/* Admin note */}
              <div className="flex items-center gap-2 justify-center my-2">
                <div className="flex-1 h-px bg-border-subtle" />
                <span className="font-archivo font-semibold text-[10px] text-text-muted">Admin created #correct-score · 12:04</span>
                <div className="flex-1 h-px bg-border-subtle" />
              </div>
            </div>

            {/* Composer */}
            <div className="flex-shrink-0 px-4 pb-3 pt-2.5 border-t border-border-subtle">
              <div className="flex items-center gap-2.5 bg-bg-secondary border border-white/10 rounded-[14px] px-4 py-2.5">
                <PlusCircle size={21} className="text-text-muted" />
                <span className="flex-1 font-archivo font-medium text-[13px] text-text-muted">Message #fixed-vip</span>
                <div className="w-8 h-8 rounded-[9px] bg-accent-lime flex items-center justify-center">
                  <Send size={15} className="text-bg-primary" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Betslip bar - shown on home/slips tabs */}
      {(tab === "home" || tab === "slips") && (
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

      {/* Bottom nav */}
      <div className="flex-shrink-0 flex items-center justify-around px-2 pb-3 pt-2 bg-[rgba(11,12,15,0.92)] backdrop-blur-lg border-t border-border-subtle z-20 safe-bottom">
        {NAV_ITEMS.map((item) => {
          const isActive = tab === item.id;
          const Icon = isActive ? item.activeIcon : item.icon;
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
  );
}