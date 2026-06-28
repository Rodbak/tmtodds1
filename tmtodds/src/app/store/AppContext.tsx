import { createContext, useContext } from "react";

export type Tab = "home" | "slips" | "proof" | "vip" | "chat";

export type Pick = {
  id: string;
  league: string;
  time: string;
  fixture: string;
  market: string;
  odds: string;
  tag: string;
  tagStyle: string;
  locked: boolean;
  addedToSlip: boolean;
};

export type LedgerRow = {
  id: string;
  match: string;
  market: string;
  date: string;
  status: "WON" | "LOST" | "PENDING";
  odds: string;
  statusColor: string;
};

export type ChatMsg = {
  id: string;
  avatar: string;
  avatarColor: string;
  name: string;
  time: string;
  text: string;
};

export type Subscription = {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  ctaStyle: string;
  borderColor?: string;
  gradient?: string;
};

export type SlipItem = {
  pickId: string;
  odds: number;
};

export type AppState = {
  tab: Tab;
  setTab: (t: Tab) => void;
  picks: Pick[];
  toggleSlip: (id: string) => void;
  slipItems: SlipItem[];
  ledger: LedgerRow[];
  chatMessages: ChatMsg[];
  sendMessage: (text: string) => void;
  user: { name: string; email: string; plan: string | null } | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  subscribe: (planId: string) => void;
};

const AppContext = createContext<AppState | null>(null);

const INITIAL_PICKS: Pick[] = [
  { id: "p1", league: "Premier League", time: "Sun 15:00", fixture: "Arsenal vs Aston Villa", market: "Over 1.5 · Yes", odds: "1.35", tag: "Free", tagStyle: "bg-white/8 text-[#B8C0CC]", locked: false, addedToSlip: false },
  { id: "p2", league: "UCL", time: "Mon 19:00", fixture: "Inter vs PSG", market: "BTTS · Yes", odds: "1.72", tag: "Confirmed", tagStyle: "bg-[rgba(87,217,255,0.14)] text-accent-cyan", locked: false, addedToSlip: false },
  { id: "p3", league: "Serie A", time: "Tue 17:45", fixture: "Milan vs Napoli", market: "Correct Score Vault", odds: "••", tag: "Correct score", tagStyle: "bg-[rgba(245,196,81,0.14)] text-accent-gold", locked: true, addedToSlip: false },
  { id: "p4", league: "LaLiga", time: "Wed 20:00", fixture: "Barcelona vs Sevilla", market: "Home · Win", odds: "1.45", tag: "Confirmed", tagStyle: "bg-[rgba(87,217,255,0.14)] text-accent-cyan", locked: false, addedToSlip: false },
];

const INITIAL_LEDGER: LedgerRow[] = [
  { id: "l1", match: "Inter — PSG", market: "BTTS · Yes · 11 May", date: "", status: "WON", odds: "1.72", statusColor: "text-accent-green" },
  { id: "l2", match: "Milan — Napoli", market: "Correct Score · 2-1 · 12 May", date: "", status: "WON", odds: "9.00", statusColor: "text-accent-green" },
  { id: "l3", match: "Bayern — Leipzig", market: "Over 2.5 · Yes · 10 May", date: "", status: "LOST", odds: "1.55", statusColor: "text-accent-red" },
  { id: "l4", match: "Arsenal — Aston Villa", market: "Over 1.5 · Yes · Today 15:00", date: "", status: "PENDING", odds: "1.35", statusColor: "text-accent-gold" },
  { id: "l5", match: "Real Madrid — Girona", market: "Home · Win · 9 May", date: "", status: "WON", odds: "1.40", statusColor: "text-accent-green" },
];

const INITIAL_CHAT: ChatMsg[] = [
  { id: "m1", avatar: "T", avatarColor: "bg-accent-lime text-bg-primary", name: "TMT Admin", time: "11:58", text: "Fixed slip is in 🔒 Here's today's confirmed line — full board on the Slips tab." },
  { id: "m2", avatar: "K", avatarColor: "bg-[#1f2937] text-accent-cyan", name: "Kwame_GH", time: "12:01", text: "Bagged the Inter line last week 🙌 staying disciplined this time" },
  { id: "m3", avatar: "A", avatarColor: "bg-[#1f2937] text-accent-gold", name: "Ama_Accra", time: "12:03", text: "Is correct-score channel unlocking for Elite this week?" },
];

const PLANS: Subscription[] = [
  { id: "fixed", title: "TMT Fixed Pass", subtitle: "7 days · weekly", tag: "Fixed", tagColor: "text-accent-lime", price: "₵70", period: "/week", features: ["Fixed-match slips", "Members' lounge access"], cta: "Subscribe", ctaStyle: "border border-white/16 rounded-[12px] text-text-primary font-extrabold", borderColor: "border-border-subtle" },
  { id: "pro", title: "TMT Pro Confirmed", subtitle: "7 days · weekly", tag: "Fixed + Confirmed", tagColor: "text-accent-cyan", price: "₵150", period: "/week", features: ["Everything in Fixed", "Confirmed daily picks", "Priority lounge channels"], cta: "Get this plan", ctaStyle: "bg-accent-lime rounded-[12px] text-bg-primary font-extrabold", borderColor: "border-accent-lime", gradient: "bg-gradient-to-br from-[#1a2410] to-bg-secondary" },
  { id: "elite", title: "TMT Elite", subtitle: "30 days · monthly", tag: "All access", tagColor: "text-text-secondary", price: "₵500", period: "/month", features: ["Fixed + Confirmed, all month", "Best value for regulars"], cta: "Subscribe", ctaStyle: "border border-white/16 rounded-[12px] text-text-primary font-extrabold", borderColor: "border-border-subtle" },
  { id: "vault", title: "Correct Score Vault", subtitle: "30 days · monthly", tag: "Correct score · premium", tagColor: "text-accent-gold", price: "₵1000", period: "/month", features: ["Everything, plus correct-score vault", "Highest-odds picks (9.00+)"], cta: "Subscribe", ctaStyle: "bg-accent-gold rounded-[12px] text-bg-primary font-extrabold", borderColor: "border-border-gold" },
];

export { AppContext, INITIAL_PICKS, INITIAL_LEDGER, INITIAL_CHAT, PLANS };
