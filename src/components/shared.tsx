import { Check, Plus, Lock } from "lucide-react";
import type { PickDTO, ChatMessageDTO, ChatAttachedPick } from "@/lib/types";
import type { PlanId } from "@/lib/plans";
import { PLANS } from "@/lib/plans";
import { formatKickoff, formatClock, formatShortDate } from "@/lib/format";
import { TIER_META, STATUS_META, PLAN_STYLE } from "./meta";

export function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="flex-1 bg-bg-secondary border border-border-subtle rounded-[14px] p-3">
      <div className={`font-mono font-extrabold text-[22px] leading-none ${color}`}>{value}</div>
      <div className="font-semibold text-[10px] text-text-secondary mt-1">{label}</div>
    </div>
  );
}

export function FormBadge({ letter, variant }: { letter: string; variant: "win" | "loss" | "draw" }) {
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

export function TierCard({
  plan,
  isCurrent,
  loading,
  onClick,
}: {
  plan: (typeof PLANS)[number];
  isCurrent: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  const style = PLAN_STYLE[plan.id as PlanId];
  return (
    <div className={`relative rounded-[18px] p-4 ${style.gradient || "bg-bg-secondary"} border ${style.borderColor}`}>
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
      <div className="flex flex-col gap-1.5 mb-3">
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
        {isCurrent ? "Current plan" : loading ? "Redirecting…" : plan.ctaLabel}
      </button>
    </div>
  );
}

export function LedgerRow({ pick }: { pick: PickDTO }) {
  const meta = STATUS_META[pick.status];
  const Icon = meta.Icon;
  // Settled results stay fully visible -- that's the point of a proof
  // screen. A still-pending pick can be locked exactly like the board,
  // so this list can't be used to peek at a paid pick early.
  return (
    <div className={`bg-bg-secondary border rounded-[14px] p-3 flex items-center gap-3 ${pick.locked ? "border-border-gold" : "border-border-subtle"}`}>
      <div className={`w-9 h-9 rounded-[10px] ${meta.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={meta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-archivo font-extrabold text-[13px] text-text-primary truncate">{pick.fixture}</div>
        <div className="font-archivo font-medium text-[11px] text-text-secondary mt-0.5">
          {pick.locked ? (
            <span className="inline-flex items-center gap-1 text-accent-gold">
              <Lock size={10} /> Unlock to view market
            </span>
          ) : (
            <>{pick.market} · {formatShortDate(pick.kickoffAt)}</>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={`font-mono font-extrabold text-[14px] ${meta.color}`}>{meta.label}</div>
        <div className="font-mono text-[11px] text-text-muted mt-0.5">{pick.odds != null ? `@${pick.odds.toFixed(2)}` : "••"}</div>
      </div>
    </div>
  );
}

export function PickCard({ pick, addedToSlip, onToggle }: { pick: PickDTO; addedToSlip: boolean; onToggle: () => void }) {
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

/** The small "slip card" a chat message can embed, mirroring the board's own pick card language. */
export function EmbeddedPickCard({ pick }: { pick: ChatAttachedPick }) {
  const meta = TIER_META[pick.tier];
  return (
    <div className={`mt-2 rounded-[13px] p-3 bg-bg-primary border ${pick.locked ? "border-border-gold" : "border-border-subtle"}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-archivo font-semibold text-[10px] text-text-secondary">{pick.league} · {formatKickoff(pick.kickoffAt)}</span>
        <span className={`font-archivo font-extrabold text-[8px] tracking-wider uppercase px-1.5 py-0.5 rounded-[5px] ${meta.tagStyle}`}>{meta.label}</span>
      </div>
      <div className="font-archivo font-extrabold text-[13px] text-text-primary mb-1.5">{pick.fixture}</div>
      {pick.locked ? (
        <div className="flex items-center gap-1.5">
          <Lock size={12} className="text-accent-gold" />
          <span className="font-archivo font-semibold text-[10px] text-text-secondary">Unlock to view this pick</span>
        </div>
      ) : (
        <div className="flex items-end justify-between">
          <span className="font-archivo font-bold text-[11px] text-accent-lime">{pick.market}</span>
          <span className="font-mono font-extrabold text-[15px] text-text-primary">{pick.odds?.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

export function ChatMessageBubble({ message }: { message: ChatMessageDTO }) {
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
        {message.attachedPick && <EmbeddedPickCard pick={message.attachedPick} />}
      </div>
    </div>
  );
}
