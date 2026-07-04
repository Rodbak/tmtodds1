import type { PlanDef } from "@/lib/plans";
import { Check } from "lucide-react";

interface PlanStyle {
  tagColor: string;
  ctaStyle: string;
  borderColor: string;
  gradient?: string;
}

export interface TierCardProps {
  plan: PlanDef;
  style: PlanStyle;
  isCurrent: boolean;
  loading: boolean;
  onClick: () => void;
}

export default function TierCard({ plan, style, isCurrent, loading, onClick }: TierCardProps) {
  const s = style;
  return (
    <div className={`relative rounded-[18px] p-4 h-full flex flex-col ${s.gradient || "bg-bg-secondary"} border ${s.borderColor}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className={`font-archivo font-extrabold text-[9px] tracking-widest uppercase mb-1 ${s.tagColor}`}>{plan.tag}</div>
          <div className="font-archivo font-extrabold text-[17px] text-text-primary">{plan.title}</div>
          <div className="font-archivo font-medium text-[11px] text-text-secondary mt-0.5">{plan.subtitle}</div>
        </div>
        <div className="text-right">
          <div className="font-mono font-extrabold text-[26px] leading-none text-text-primary">&#x20B5;{plan.priceGHS}</div>
          <div className="font-mono text-[9px] text-text-muted">{plan.periodLabel}</div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 mb-3 flex-1">
        {plan.features.map((f) => (
          <div key={f} className="flex items-center gap-2">
            <Check size={13} className={s.tagColor} />
            <span className="font-archivo font-medium text-[12px] text-text-secondary">{f}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onClick}
        disabled={loading || isCurrent}
        className={`w-full rounded-[12px] py-3 text-center font-archivo font-extrabold text-[14px] ${s.ctaStyle} disabled:opacity-60`}
      >
        {isCurrent ? "Current plan" : loading ? "Redirecting…" : "Subscribe"}
      </button>
    </div>
  );
}