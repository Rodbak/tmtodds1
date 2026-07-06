"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { PickDTO, PickStatus } from "@/lib/types";
import type { Tier } from "@/lib/plans";
import { formatKickoff } from "@/lib/format";

const TIER_OPTIONS: { id: Tier; label: string }[] = [
  { id: "free", label: "Free" },
  { id: "weekly", label: "Weekly" },
  { id: "pro", label: "Pro" },
  { id: "elite", label: "Elite" },
  { id: "correct_score", label: "Correct score" },
];

const STATUS_COLOR: Record<PickStatus, string> = {
  won: "text-accent-green",
  lost: "text-accent-red",
  void: "text-text-muted",
  pending: "text-accent-gold",
};

const field = "w-full bg-bg-primary border border-border-subtle rounded-[10px] px-3 py-2.5 font-archivo text-[13px] text-text-primary outline-none focus:border-accent-lime placeholder:text-text-muted";
const fieldLabel = "block font-archivo font-bold text-[11px] text-text-secondary uppercase tracking-wide mb-1.5";

type DraftPick = { league: string; fixture: string; market: string; odds: string; kickoffAt: string; tier: Tier };

const EMPTY_DRAFT: DraftPick = { league: "", fixture: "", market: "", odds: "", kickoffAt: "", tier: "free" };

/** Owns fetching + refreshing both lists the admin panel needs. */
function useAdminBoard() {
  const [pending, setPending] = useState<PickDTO[]>([]);
  const [settled, setSettled] = useState<PickDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, ledgerRes] = await Promise.all([fetch("/api/picks?scope=today"), fetch("/api/picks?scope=ledger")]);
      const [todayJson, ledgerJson] = await Promise.all([todayRes.json(), ledgerRes.json()]);
      setPending(todayJson.items ?? []);
      setSettled((ledgerJson.items ?? []).slice(0, 10));
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch-on-mount: reload() sets loading before awaiting (see AppProvider.tsx
  // for the same pattern and why the lint rule is disabled here).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  return { pending, settled, loading, reload };
}

function NewPickForm({ onCreated }: { onCreated: () => void }) {
  const [draft, setDraft] = useState<DraftPick>(EMPTY_DRAFT);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const patch = (fields: Partial<DraftPick>) => setDraft((d) => ({ ...d, ...fields }));

  const submit = async () => {
    setError("");
    if (!draft.league || !draft.fixture || !draft.market || !draft.odds || !draft.kickoffAt) {
      setError("All fields are required");
      return;
    }
    const oddsNum = parseFloat(draft.odds);
    if (Number.isNaN(oddsNum) || oddsNum <= 1) {
      setError("Odds must be a number greater than 1");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, odds: oddsNum, kickoffAt: new Date(draft.kickoffAt).toISOString() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not create pick");
      setDraft(EMPTY_DRAFT);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create pick");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-bg-secondary border border-border-subtle rounded-[16px] p-5 mb-8">
      <h2 className="font-archivo font-extrabold text-[15px] mb-4">Post a new pick</h2>
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className={fieldLabel}>League</label>
          <input placeholder="Premier League" value={draft.league} onChange={(e) => patch({ league: e.target.value })} className={field} />
        </div>
        <div>
          <label className={fieldLabel}>Fixture</label>
          <input placeholder="Arsenal vs Aston Villa" value={draft.fixture} onChange={(e) => patch({ fixture: e.target.value })} className={field} />
        </div>
        <div>
          <label className={fieldLabel}>Market</label>
          <input placeholder="Over 1.5 · Yes" value={draft.market} onChange={(e) => patch({ market: e.target.value })} className={field} />
        </div>
        <div>
          <label className={fieldLabel}>Odds</label>
          <input placeholder="1.72" inputMode="decimal" value={draft.odds} onChange={(e) => patch({ odds: e.target.value })} className={field} />
        </div>
        <div>
          <label className={fieldLabel}>Kickoff</label>
          <input type="datetime-local" value={draft.kickoffAt} onChange={(e) => patch({ kickoffAt: e.target.value })} className={field} />
        </div>
        <div>
          <label className={fieldLabel}>Tier</label>
          <select value={draft.tier} onChange={(e) => patch({ tier: e.target.value as Tier })} className={field}>
            {TIER_OPTIONS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="text-accent-red text-[12px] font-archivo mb-3">{error}</p>}
      <button onClick={submit} disabled={submitting} className="bg-accent-lime text-bg-primary font-archivo font-extrabold text-[13px] rounded-[10px] px-4 py-2.5 disabled:opacity-60">
        {submitting ? "Posting…" : "Post pick"}
      </button>
    </section>
  );
}

function PendingPickCard({ pick, onSettled }: { pick: PickDTO; onSettled: () => void }) {
  const [busy, setBusy] = useState(false);

  const settle = async (status: "won" | "lost" | "void") => {
    setBusy(true);
    try {
      await fetch(`/api/picks/${pick.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      onSettled();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    await fetch(`/api/picks/${pick.id}`, { method: "DELETE" });
    onSettled();
  };

  return (
    <div className="bg-bg-secondary border border-border-subtle rounded-[12px] p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="font-archivo font-bold text-[14px] truncate">{pick.fixture}</div>
        <div className="font-archivo text-[12px] text-text-secondary">
          {pick.league} · {formatKickoff(pick.kickoffAt)} · {pick.market} · @{pick.odds?.toFixed(2)} · tier: {pick.tier}
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={() => settle("won")} disabled={busy} className="text-[12px] font-archivo font-extrabold bg-[rgba(52,224,138,0.14)] text-accent-green rounded-[8px] px-3 py-1.5 disabled:opacity-50">Won</button>
        <button onClick={() => settle("lost")} disabled={busy} className="text-[12px] font-archivo font-extrabold bg-[rgba(255,77,77,0.13)] text-accent-red rounded-[8px] px-3 py-1.5 disabled:opacity-50">Lost</button>
        <button onClick={() => settle("void")} disabled={busy} className="text-[12px] font-archivo font-extrabold bg-white/8 text-text-secondary rounded-[8px] px-3 py-1.5 disabled:opacity-50">Void</button>
        <button onClick={remove} className="text-[12px] font-archivo font-extrabold text-text-muted px-2" title="Delete pick">✕</button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { pending, settled, loading, reload } = useAdminBoard();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-anton text-[28px] tracking-wider uppercase">TMTODDS Admin</h1>
        <Link href="/" className="font-archivo font-bold text-[13px] text-accent-lime">← Back to app</Link>
      </div>

      <NewPickForm onCreated={reload} />

      <section className="mb-8">
        <h2 className="font-archivo font-extrabold text-[15px] mb-4">Pending — needs settling ({pending.length})</h2>
        {loading ? (
          <p className="text-text-muted text-[13px] font-archivo">Loading…</p>
        ) : pending.length === 0 ? (
          <p className="text-text-muted text-[13px] font-archivo">No pending picks.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pending.map((p) => (
              <PendingPickCard key={p.id} pick={p} onSettled={reload} />
            ))}
          </div>
        )}
      </section>

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
