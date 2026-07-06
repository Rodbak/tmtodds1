"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PickDTO, PickStatus } from "@/lib/types";
import { formatKickoff } from "@/lib/format";

const TIER_OPTIONS: { id: string; label: string }[] = [
  { id: "free", label: "Free" },
  { id: "weekly", label: "Weekly" },
  { id: "pro", label: "Pro" },
  { id: "elite", label: "Elite" },
  { id: "correct_score", label: "Correct score" },
];

const inputClass =
  "w-full bg-bg-primary border border-border-subtle rounded-[10px] px-3 py-2.5 font-archivo text-[13px] text-text-primary outline-none focus:border-accent-lime placeholder:text-text-muted";
const labelClass = "block font-archivo font-bold text-[11px] text-text-secondary uppercase tracking-wide mb-1.5";

const STATUS_COLOR: Record<PickStatus, string> = {
  won: "text-accent-green",
  lost: "text-accent-red",
  void: "text-text-muted",
  pending: "text-accent-gold",
};

export default function AdminPage() {
  const [pending, setPending] = useState<PickDTO[]>([]);
  const [settled, setSettled] = useState<PickDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const [league, setLeague] = useState("");
  const [fixture, setFixture] = useState("");
  const [market, setMarket] = useState("");
  const [odds, setOdds] = useState("");
  const [kickoffAt, setKickoffAt] = useState("");
  const [tier, setTier] = useState("free");

  const load = async () => {
    setLoading(true);
    try {
      const [todayRes, ledgerRes] = await Promise.all([
        fetch("/api/picks?scope=today"),
        fetch("/api/picks?scope=ledger"),
      ]);
      const todayJson = await todayRes.json();
      const ledgerJson = await ledgerRes.json();
      setPending(todayJson.items ?? []);
      setSettled((ledgerJson.items ?? []).slice(0, 10));
    } finally {
      setLoading(false);
    }
  };

  // Standard fetch-on-mount pattern: load() sets its own loading flag
  // before awaiting, which is intentional here (see AppProvider.tsx).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const submitPick = async () => {
    setFormError("");
    if (!league || !fixture || !market || !odds || !kickoffAt) {
      setFormError("All fields are required");
      return;
    }
    const oddsNum = parseFloat(odds);
    if (Number.isNaN(oddsNum) || oddsNum <= 1) {
      setFormError("Odds must be a number greater than 1");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          league,
          fixture,
          market,
          tier,
          odds: oddsNum,
          kickoffAt: new Date(kickoffAt).toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not create pick");
      setLeague("");
      setFixture("");
      setMarket("");
      setOdds("");
      setKickoffAt("");
      setTier("free");
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create pick");
    } finally {
      setCreating(false);
    }
  };

  const settle = async (id: string, status: "won" | "lost" | "void") => {
    setSettlingId(id);
    try {
      await fetch(`/api/picks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    } finally {
      setSettlingId(null);
    }
  };

  const removePick = async (id: string) => {
    await fetch(`/api/picks/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-anton text-[28px] tracking-wider uppercase">TMTODDS Admin</h1>
        <Link href="/" className="font-archivo font-bold text-[13px] text-accent-lime">← Back to app</Link>
      </div>

      {/* New pick form */}
      <section className="bg-bg-secondary border border-border-subtle rounded-[16px] p-5 mb-8">
        <h2 className="font-archivo font-extrabold text-[15px] mb-4">Post a new pick</h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className={labelClass}>League</label>
            <input placeholder="Premier League" value={league} onChange={(e) => setLeague(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Fixture</label>
            <input placeholder="Arsenal vs Aston Villa" value={fixture} onChange={(e) => setFixture(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Market</label>
            <input placeholder="Over 1.5 · Yes" value={market} onChange={(e) => setMarket(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Odds</label>
            <input placeholder="1.72" inputMode="decimal" value={odds} onChange={(e) => setOdds(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Kickoff</label>
            <input type="datetime-local" value={kickoffAt} onChange={(e) => setKickoffAt(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Tier</label>
            <select value={tier} onChange={(e) => setTier(e.target.value)} className={inputClass}>
              {TIER_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
        {formError && <p className="text-accent-red text-[12px] font-archivo mb-3">{formError}</p>}
        <button
          onClick={submitPick}
          disabled={creating}
          className="bg-accent-lime text-bg-primary font-archivo font-extrabold text-[13px] rounded-[10px] px-4 py-2.5 disabled:opacity-60"
        >
          {creating ? "Posting…" : "Post pick"}
        </button>
      </section>

      {/* Pending picks */}
      <section className="mb-8">
        <h2 className="font-archivo font-extrabold text-[15px] mb-4">Pending — needs settling ({pending.length})</h2>
        {loading ? (
          <p className="text-text-muted text-[13px] font-archivo">Loading…</p>
        ) : pending.length === 0 ? (
          <p className="text-text-muted text-[13px] font-archivo">No pending picks.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pending.map((p) => (
              <div key={p.id} className="bg-bg-secondary border border-border-subtle rounded-[12px] p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-archivo font-bold text-[14px] truncate">{p.fixture}</div>
                  <div className="font-archivo text-[12px] text-text-secondary">
                    {p.league} · {formatKickoff(p.kickoffAt)} · {p.market} · @{p.odds?.toFixed(2)} · tier: {p.tier}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => settle(p.id, "won")}
                    disabled={settlingId === p.id}
                    className="text-[12px] font-archivo font-extrabold bg-[rgba(52,224,138,0.14)] text-accent-green rounded-[8px] px-3 py-1.5 disabled:opacity-50"
                  >
                    Won
                  </button>
                  <button
                    onClick={() => settle(p.id, "lost")}
                    disabled={settlingId === p.id}
                    className="text-[12px] font-archivo font-extrabold bg-[rgba(255,77,77,0.13)] text-accent-red rounded-[8px] px-3 py-1.5 disabled:opacity-50"
                  >
                    Lost
                  </button>
                  <button
                    onClick={() => settle(p.id, "void")}
                    disabled={settlingId === p.id}
                    className="text-[12px] font-archivo font-extrabold bg-white/8 text-text-secondary rounded-[8px] px-3 py-1.5 disabled:opacity-50"
                  >
                    Void
                  </button>
                  <button onClick={() => removePick(p.id)} className="text-[12px] font-archivo font-extrabold text-text-muted px-2" title="Delete pick">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recently settled */}
      <section>
        <h2 className="font-archivo font-extrabold text-[15px] mb-4">Recently settled</h2>
        {settled.length === 0 ? (
          <p className="text-text-muted text-[13px] font-archivo">Nothing settled yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {settled.map((p) => (
              <div key={p.id} className="bg-bg-secondary border border-border-subtle rounded-[12px] p-3 flex items-center justify-between text-[12px] font-archivo gap-3">
                <span className="truncate">{p.fixture} · {p.market}</span>
                <span className={`font-extrabold flex-shrink-0 ${STATUS_COLOR[p.status]}`}>{p.status.toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
