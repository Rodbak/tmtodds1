import { Check, X, Minus, Clock } from "lucide-react";
import type { PickDTO } from "@/lib/types";
import { formatShortDate } from "@/lib/format";

const STATUS_META = {
  won: { label: "WON", color: "text-accent-green", bg: "bg-[rgba(52,224,138,0.14)]", Icon: Check },
  lost: { label: "LOST", color: "text-accent-red", bg: "bg-[rgba(255,77,77,0.13)]", Icon: X },
  void: { label: "VOID", color: "text-text-muted", bg: "bg-white/8", Icon: Minus },
  pending: { label: "PENDING", color: "text-accent-gold", bg: "bg-[rgba(245,196,81,0.14)]", Icon: Clock },
} as const;

interface LedgerRowProps {
  pick: PickDTO;
}

export default function LedgerRow({ pick }: LedgerRowProps) {
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