"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useApp } from "@/app/store/AppProvider";
import { LedgerRow } from "./shared";
import { LEDGER_FILTERS } from "./meta";

export function ProofTab() {
  const { ledger, stats, ledgerLoading, ledgerFilter, setLedgerFilter } = useApp();
  const [ledgerExpanded, setLedgerExpanded] = useState(false);

  const filtered = ledger.filter((p) => ledgerFilter === "all" || p.status === ledgerFilter);
  const visibleLedger = ledgerExpanded ? filtered : filtered.slice(0, 8);

  return (
    <div className="px-4 pb-4 lg:px-8 lg:pb-10 lg:content-max">
      <div className="flex items-center gap-2 px-5 py-2 lg:px-0 lg:pt-6">
        <ShieldCheck size={22} className="text-accent-lime" />
        <h2 className="font-anton text-[26px] tracking-wider text-text-primary uppercase">Proof & results</h2>
      </div>
      <p className="font-archivo font-medium text-[12px] text-text-secondary px-5 mb-4 leading-snug lg:px-0 lg:mb-6">
        Every pick logged with its outcome. Win, lose, or pending — nothing hidden.
      </p>

      <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-8 lg:items-start">
        {/* Win rate hero -- sticky alongside the ledger at desktop widths */}
        <div className="mx-4 lg:mx-0 lg:sticky lg:top-6 rounded-[20px] p-5 lg:p-6 bg-gradient-to-br from-[#1a2410] to-bg-secondary border border-border-lime relative overflow-hidden">
          <div className="flex items-end justify-between lg:flex-col lg:items-start lg:gap-6">
            <div>
              <div className="font-archivo font-extrabold text-[10px] tracking-widest uppercase text-accent-lime mb-2">Last 30 days</div>
              {stats?.winRate30 != null ? (
                <>
                  <div className="font-mono font-extrabold text-[60px] leading-[0.82] text-text-primary">
                    {stats.winRate30}
                    <span className="text-[30px] text-accent-lime">%</span>
                  </div>
                  <div className="font-archivo font-semibold text-[12px] text-text-secondary mt-2">
                    {stats.wonLast30} won · {stats.lostLast30} lost · settled picks
                  </div>
                </>
              ) : (
                <div className="font-archivo font-semibold text-[14px] text-text-secondary py-3 max-w-[220px]">No settled picks in the last 30 days yet.</div>
              )}
            </div>
            <div className="flex flex-col items-center gap-1 pb-1 lg:items-start lg:pb-0">
              <div className="font-mono font-extrabold text-[24px] text-accent-green">{stats && stats.streak > 0 ? `W${stats.streak}` : "—"}</div>
              <div className="font-archivo font-bold text-[9px] tracking-widest uppercase text-text-muted">streak</div>
            </div>
          </div>
        </div>

        <div>
          {/* Filter segmented control */}
          <div className="flex gap-1.5 px-4 pt-4 lg:px-0 lg:pt-0">
            {LEDGER_FILTERS.map((f) => {
              const active = ledgerFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    setLedgerFilter(f.id);
                    setLedgerExpanded(false);
                  }}
                  aria-pressed={active}
                  className={`px-3.5 py-2 rounded-[11px] font-archivo text-[12px] ${
                    active ? "bg-accent-lime font-extrabold text-bg-primary" : "bg-bg-secondary border border-border-subtle font-bold text-text-secondary"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Ledger */}
          <div className="px-4 flex flex-col gap-2 pt-3 lg:px-0 lg:pt-4 lg:grid lg:grid-cols-2 lg:gap-2.5">
            {ledgerLoading ? (
              <div className="text-center py-8 lg:col-span-full">
                <span className="font-archivo text-[12px] text-text-muted">Loading results…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 lg:col-span-full">
                <span className="font-archivo text-[12px] text-text-muted">
                  {ledger.length === 0 ? "No picks yet. Once picks are posted, every result shows up here." : `No ${ledgerFilter} picks yet.`}
                </span>
              </div>
            ) : (
              visibleLedger.map((p) => <LedgerRow key={p.id} pick={p} />)
            )}
          </div>
          {!ledgerLoading && filtered.length > visibleLedger.length && (
            <div className="text-center py-4 lg:text-left lg:px-0">
              <button onClick={() => setLedgerExpanded(true)} className="font-archivo font-bold text-[12px] text-accent-lime">
                Show all {filtered.length} results →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
