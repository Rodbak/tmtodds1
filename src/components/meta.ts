import { House, ListChecks, ShieldCheck, Crown, MessageCircle, Check, X, Minus, Clock } from "lucide-react";
import type { Tab } from "@/app/store/AppContext";
import type { Tier, PlanId } from "@/lib/plans";
import type { PickStatus } from "@/lib/types";

export const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "Home", icon: House },
  { id: "slips", label: "Slips", icon: ListChecks },
  { id: "proof", label: "Proof", icon: ShieldCheck },
  { id: "vip", label: "VIP", icon: Crown },
  { id: "chat", label: "Chat", icon: MessageCircle },
];

export const TIER_META: Record<Tier, { label: string; tagStyle: string }> = {
  free: { label: "Free", tagStyle: "bg-white/8 text-[#B8C0CC]" },
  weekly: { label: "Locked", tagStyle: "bg-[rgba(204,255,51,0.14)] text-accent-lime" },
  pro: { label: "Pro analysis", tagStyle: "bg-[rgba(87,217,255,0.14)] text-accent-cyan" },
  elite: { label: "Elite", tagStyle: "bg-white/10 text-text-secondary" },
  correct_score: { label: "Correct score", tagStyle: "bg-[rgba(245,196,81,0.14)] text-accent-gold" },
};

export const STATUS_META: Record<PickStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  won: { label: "WON", color: "text-accent-green", bg: "bg-[rgba(52,224,138,0.14)]", Icon: Check },
  lost: { label: "LOST", color: "text-accent-red", bg: "bg-[rgba(255,77,77,0.13)]", Icon: X },
  void: { label: "VOID", color: "text-text-muted", bg: "bg-white/8", Icon: Minus },
  pending: { label: "PENDING", color: "text-accent-gold", bg: "bg-[rgba(245,196,81,0.14)]", Icon: Clock },
};

export const PLAN_STYLE: Record<PlanId, { tagColor: string; ctaStyle: string; borderColor: string; gradient?: string }> = {
  weekly: { tagColor: "text-accent-lime", ctaStyle: "border border-white/16 text-text-primary", borderColor: "border-border-subtle" },
  pro: { tagColor: "text-accent-cyan", ctaStyle: "bg-accent-lime text-bg-primary", borderColor: "border-accent-lime", gradient: "bg-gradient-to-br from-[#1a2410] to-bg-secondary" },
  elite: { tagColor: "text-text-secondary", ctaStyle: "border border-white/16 text-text-primary", borderColor: "border-border-subtle" },
  correct_score: { tagColor: "text-accent-gold", ctaStyle: "bg-accent-gold text-bg-primary", borderColor: "border-border-gold" },
};

// Channel ids use underscores (matching the DB/tier naming); labels are
// what's displayed after the "#", hyphenated the way the design shows.
export const CHANNELS: { id: string; label: string; requiresTier: Tier }[] = [
  { id: "locked_vip", label: "locked-vip", requiresTier: "weekly" },
  { id: "general", label: "general", requiresTier: "free" },
  { id: "correct_score", label: "correct-score", requiresTier: "correct_score" },
];

export const LEDGER_FILTERS: { id: "all" | "won" | "lost" | "pending"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
  { id: "pending", label: "Pending" },
];
