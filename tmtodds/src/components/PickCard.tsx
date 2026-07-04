import { Check, Plus, Lock } from "lucide-react";
import type { PickDTO } from "@/lib/types";

const TIER_META = {
  free: { label: "Free", tagStyle: "bg-white/8 text-[#B8C0CC]" },
  weekly: { label: "Weekly", tagStyle: "bg-[rgba(204,255,51,0.14)] text-accent-lime" },
  pro: { label: "Pro analysis", tagStyle: "bg-[rgba(87,217,255,0.14)] text-accent-cyan" },
  elite: { label: "Elite", tagStyle: "bg-white/10 text-text-secondary" },
  correct_score: { label: "Correct score", tagStyle: "bg-[rgba(245,196,81,0.14)] text-accent-gold" },
} as const;

interface PickCardProps {
  pick: PickDTO;
  addedToSlip: boolean;
  onToggle: () => void;
}

export default function PickCard({ pick, addedToSlip, onToggle }: PickCardProps) {
  const meta = TIER_META[pick.tier];
  const locked = pick.locked;
  return (
    <div className={`rounded-[16px] p-4 bg-bg-secondary border ${locked ? "border-border-gold" : "border-border-subtle"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-archivo font-semibold text-[11px] text-text-secondary">{pick.league}</span>
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