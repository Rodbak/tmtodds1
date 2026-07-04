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

const CHANNELS: { id: string; label: string; requiredTier: string }[] = [
  { id: "announcements", label: "Announcements", requiredTier: "free" },
  { id: "general", label: "General", requiredTier: "weekly" },
  { id: "correct_score", label: "Correct Score", requiredTier: "correct_score" },
  { id: "fixed-vip", label: "Fixed VIP", requiredTier: "correct_score" },
];

const inputClass =
  "w-full bg-bg-primary border border-border-subtle rounded-[10px] px-3 py-2.5 font-archivo text-[13px] text-text-primary outline-none focus:border-accent-lime placeholder:text-text-muted";
const labelClass = "block font-archivo font-bold text-[11px] text-text-secondary uppercase tracking-wide mb-1.5";
const sectionClass = "bg-bg-secondary border border-border-subtle rounded-[16px] p-5 mb-8";
const sectionHeaderClass = "font-archivo font-extrabold text-[15px] mb-4 pb-3 border-b border-border-subtle";

const STATUS_COLOR: Record<PickStatus, string> = {
  won: "text-accent-green",
  lost: "text-accent-red",
  void: "text-text-muted",
  pending: "text-accent-gold",
};

const buttonBase = "text-[12px] font-archivo font-extrabold rounded-[8px] px-3 py-1.5 transition-all disabled:opacity-50";
const buttonWon = "bg-[rgba(52,224,138,0.14)] text-accent-green hover:bg-[rgba(52,224,138,0.22)]";
const buttonLost = "bg-[rgba(255,77,77,0.13)] text-accent-red hover:bg-[rgba(255,77,77,0.20)]";
const buttonVoid = "bg-white/8 text-text-secondary hover:bg-white/12";
const buttonPrimary = "bg-accent-lime text-bg-primary font-extrabold hover:opacity-90";

type PinnedMessage = {
  authorName: string;
  body: string;
  createdAt: string;
  isAdmin: boolean;
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

  const [pinnedChannel, setPinnedChannel] = useState("general");
  const [pinnedBody, setPinnedBody] = useState("");
  const [pinnedMessage, setPinnedMessage] = useState<PinnedMessage | null>(null);
  const [pinnedSaving, setPinnedSaving] = useState(false);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const fetchPinned = async (channel: string) => {
    try {
      const res = await fetch(`/api/chat/pinned?channel=${channel}`);
      if (res.ok) {
        const json = await res.json();
        setPinnedMessage(json.pinned ?? null);
      }
    } catch {
      // ignore
    }
  };

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

  const savePinned = async () => {
    if (!pinnedBody.trim()) return;
    setPinnedSaving(true);
    try {
      const res = await fetch("/api/chat/pinned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: pinnedChannel, body: pinnedBody }),
      });
      if (res.ok) {
        const json = await res.json();
        setPinnedMessage(json.pinned ?? null);
      }
    } finally {
      setPinnedSaving(false);
    }
  };

  const totalSettledToday = settled.length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-anton text-[28px] tracking-wider uppercase">TMTODDS Admin</h1>
        <Link href="/" className="font-archivo font-bold text-[13px] text-accent-lime hover:opacity-80">← Back to app</Link>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-bg-secondary border border-border-subtle rounded-[12px] p-4 text-center">
          <div className="font-mono text-[24px] font-bold text-accent-lime">{pending.length}</div>
          <div className="font-archivo text-[11px] text-text-secondary uppercase tracking-wide">Pending</div>
        </div>
        <div className="bg-bg-secondary border border-border-subtle rounded-[12px] p-4 text-center">
          <div className="font-mono text-[24px] font-bold text-accent-gold">{totalSettledToday}</div>
          <div className="font-archivo text-[11px] text-text-secondary uppercase tracking-wide">Settled today</div>
        </div>
        <div className="bg-bg-secondary border border-border-subtle rounded-[12px] p-4 text-center">
          <div className="font-mono text-[24px] font-bold text-accent-green">{settled.filter(p => p.status === "won").length}</div>
          <div className="font-archivo text-[11px] text-text-secondary uppercase tracking-wide">Won</div>
        </div>
        <div className="bg-bg-secondary border border-border-subtle rounded-[12px] p-4 text-center">
          <div className="font-mono text-[24px] font-bold text-accent-red">{settled.filter(p => p.status === "lost").length}</div>
          <div className="font-archivo text-[11px] text-text-secondary uppercase tracking-wide">Lost</div>
        </div>
      </div>

      {/* New pick form */}
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>Post a new pick</h2>
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
          className={`${buttonBase} ${buttonPrimary} ${creating ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {creating ? "Posting…" : "Post pick"}
        </button>
      </section>

      {/* Pinned messages section */}
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>Pinned messages</h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className={labelClass}>Channel</label>
            <select value={pinnedChannel} onChange={(e) => { setPinnedChannel(e.target.value); fetchPinned(e.target.value); }} className={inputClass}>
              {CHANNELS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-3">
          <label className={labelClass}>Pinned message content</label>
          <textarea 
            placeholder="Enter pinned message text…" 
            value={pinnedBody} 
            onChange={(e) => setPinnedBody(e.target.value)} 
            className={`${inputClass} min-h-[80px] resize-none`}
            maxLength={500}
          />
        </div>
        {pinnedMessage && (
          <div className="bg-bg-primary border border-border-subtle rounded-[10px] p-3 mb-3">
            <div className="font-archivo text-[11px] text-text-secondary mb-1">Current pinned for {CHANNELS.find(c => c.id === pinnedChannel)?.label}:</div>
            <div className="font-archivo text-[13px] text-text-primary">{pinnedMessage.body}</div>
            <div className="font-archivo text-[11px] text-text-muted mt-1">By {pinnedMessage.authorName} · {new Date(pinnedMessage.createdAt).toLocaleString()}</div>
          </div>
        )}
        <button
          onClick={savePinned}
          disabled={pinnedSaving || !pinnedBody.trim()}
          className={`${buttonBase} ${buttonPrimary} ${pinnedSaving || !pinnedBody.trim() ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {pinnedSaving ? "Saving…" : "Save pinned message"}
        </button>
      </section>

      {/* Channels section */}
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>Channels & Access Tiers</h2>
        <div className="flex flex-col gap-2">
          {CHANNELS.map((channel) => (
            <div key={channel.id} className="bg-bg-primary border border-border-subtle rounded-[10px] px-4 py-3 flex items-center justify-between">
              <div>
                <div className="font-archivo font-bold text-[14px] text-text-primary">#{channel.id}</div>
                <div className="font-archivo text-[11px] text-text-secondary">{channel.label}</div>
              </div>
              <div className="font-archivo text-[12px] text-accent-lime bg-[rgba(204,255,51,0.1)] px-2.5 py-1 rounded-[6px]">
                {TIER_OPTIONS.find(t => t.id === channel.requiredTier)?.label ?? channel.requiredTier}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pending picks */}
      <section className="mb-8">
        <h2 className={sectionHeaderClass}>Pending — needs settling ({pending.length})</h2>
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
                    {p.league} · {formatKickoff(p.kickoffAt)} · {p.market} · @{p.odds?.toFixed(2)} · {p.tier}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => settle(p.id, "won")}
                    disabled={settlingId === p.id}
                    className={`${buttonBase} ${buttonWon} ${settlingId === p.id ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Won
                  </button>
                  <button
                    onClick={() => settle(p.id, "lost")}
                    disabled={settlingId === p.id}
                    className={`${buttonBase} ${buttonLost} ${settlingId === p.id ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Lost
                  </button>
                  <button
                    onClick={() => settle(p.id, "void")}
                    disabled={settlingId === p.id}
                    className={`${buttonBase} ${buttonVoid} ${settlingId === p.id ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Void
                  </button>
                  <button onClick={() => removePick(p.id)} className="text-[12px] font-archivo font-extrabold text-text-muted px-2 hover:text-accent-red" title="Delete pick">
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
        <h2 className={sectionHeaderClass}>Recently settled</h2>
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