"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { PickDTO, PickStatus, LiveScoreDTO } from "@/lib/types";
import { isPlanActive, type Tier } from "@/lib/plans";
import { formatKickoff, formatShortDate } from "@/lib/format";
import { useLiveScores } from "@/lib/useLiveScores";
import { LiveScoreBadge } from "@/components/shared";

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

type DraftPick = { league: string; fixture: string; market: string; odds: string; kickoffAt: string; tier: Tier; externalFixtureId: string };

const EMPTY_DRAFT: DraftPick = { league: "", fixture: "", market: "", odds: "", kickoffAt: "", tier: "free", externalFixtureId: "" };

type FixtureResult = {
  externalFixtureId: string;
  league: string;
  country: string;
  home: string;
  away: string;
  kickoffAt: string;
};

/** ISO timestamp -> the local "YYYY-MM-DDTHH:mm" format a datetime-local input expects. */
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function todayDateString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Searches real fixtures from the scores provider and hands the chosen
 * one back so the pick form fills itself -- league, teams, kickoff and
 * the fixture id (which is what later powers the live badge) all come
 * from the API instead of being retyped by hand.
 */
function FixtureSearch({ onPick }: { onPick: (f: FixtureResult) => void }) {
  const [date, setDate] = useState(todayDateString());
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FixtureResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const search = async () => {
    setError("");
    setSearching(true);
    setSearched(false);
    try {
      const res = await fetch(`/api/fixtures/search?date=${date}&q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Search failed");
      setResults(json.items ?? []);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="bg-bg-primary border border-border-subtle rounded-[12px] p-3 mb-4">
      <div className="font-archivo font-bold text-[11px] text-text-secondary uppercase tracking-wide mb-2">
        Find the match — fills the form for you
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Match date"
          className={`${field} basis-[150px] flex-none w-auto`}
        />
        <input
          placeholder="Team or league (e.g. Arsenal)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") search();
          }}
          aria-label="Team or league to search for"
          className={`${field} flex-1 min-w-[180px] w-auto`}
        />
        <button
          onClick={search}
          disabled={searching || query.trim().length < 3}
          className="bg-accent-lime text-bg-primary font-archivo font-extrabold text-[12px] rounded-[10px] px-4 disabled:opacity-50"
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </div>
      {error && <p className="text-accent-red text-[11px] font-archivo mt-2">{error}</p>}
      {searched && results.length === 0 && !error && (
        <p className="text-text-muted text-[11px] font-archivo mt-2">No matches found for that day — check the date or spelling.</p>
      )}
      {results.length > 0 && (
        <div className="mt-2 flex flex-col gap-1 max-h-56 overflow-y-auto">
          {results.map((f) => (
            <button
              key={f.externalFixtureId}
              onClick={() => {
                onPick(f);
                setResults([]);
                setSearched(false);
              }}
              className="text-left bg-bg-secondary border border-border-subtle rounded-[9px] px-3 py-2 hover:border-accent-lime"
            >
              <span className="font-archivo font-bold text-[12px] text-text-primary block">
                {f.home} vs {f.away}
              </span>
              <span className="font-archivo text-[11px] text-text-secondary">
                {f.league} ({f.country}) · {new Date(f.kickoffAt).toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
        body: JSON.stringify({
          ...draft,
          odds: oddsNum,
          kickoffAt: new Date(draft.kickoffAt).toISOString(),
          externalFixtureId: draft.externalFixtureId || null,
        }),
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
      <FixtureSearch
        onPick={(f) =>
          patch({
            league: f.league,
            fixture: `${f.home} vs ${f.away}`,
            kickoffAt: toDatetimeLocal(f.kickoffAt),
            externalFixtureId: f.externalFixtureId,
          })
        }
      />
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
        <div>
          <label className={fieldLabel}>External fixture ID (optional)</label>
          <input
            placeholder="api-football fixture id, for live score"
            value={draft.externalFixtureId}
            onChange={(e) => patch({ externalFixtureId: e.target.value })}
            className={field}
          />
        </div>
      </div>
      {error && <p className="text-accent-red text-[12px] font-archivo mb-3">{error}</p>}
      <button onClick={submit} disabled={submitting} className="bg-accent-lime text-bg-primary font-archivo font-extrabold text-[13px] rounded-[10px] px-4 py-2.5 disabled:opacity-60">
        {submitting ? "Posting…" : "Post pick"}
      </button>
    </section>
  );
}

function PendingPickCard({ pick, onSettled, liveScore }: { pick: PickDTO; onSettled: () => void; liveScore?: LiveScoreDTO }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const settle = async (status: "won" | "lost" | "void") => {
    setBusy(true);
    try {
      await fetch(`/api/picks/${pick.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resultNote: note.trim() || null }),
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
        <div className="font-archivo font-bold text-[14px] truncate flex items-center gap-2">
          {pick.fixture}
          <LiveScoreBadge score={liveScore} />
        </div>
        <div className="font-archivo text-[12px] text-text-secondary">
          {pick.league} · {formatKickoff(pick.kickoffAt)} · {pick.market} · @{pick.odds?.toFixed(2)} · tier: {pick.tier}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Result note (optional)"
          aria-label="Result note"
          maxLength={120}
          className="bg-bg-primary border border-border-subtle rounded-[8px] px-2.5 py-1.5 font-archivo text-[12px] text-text-primary outline-none focus:border-accent-lime placeholder:text-text-muted w-[170px]"
        />
        <button onClick={() => settle("won")} disabled={busy} className="text-[12px] font-archivo font-extrabold bg-[rgba(52,224,138,0.14)] text-accent-green rounded-[8px] px-3 py-1.5 disabled:opacity-50">Won</button>
        <button onClick={() => settle("lost")} disabled={busy} className="text-[12px] font-archivo font-extrabold bg-[rgba(255,77,77,0.13)] text-accent-red rounded-[8px] px-3 py-1.5 disabled:opacity-50">Lost</button>
        <button onClick={() => settle("void")} disabled={busy} className="text-[12px] font-archivo font-extrabold bg-white/8 text-text-secondary rounded-[8px] px-3 py-1.5 disabled:opacity-50">Void</button>
        <button onClick={remove} aria-label="Delete pick" title="Delete pick" className="text-[12px] font-archivo font-extrabold text-text-muted px-2">✕</button>
      </div>
    </div>
  );
}

type PlanSettings = { id: string; tag: string; title: string; subtitle: string; priceGHS: number; periodDays: number; hidden?: boolean };

type PlanDraft = { price: string; days: string; tag: string; title: string; subtitle: string };

/**
 * Plan settings editor: display text (tag/name/subtitle), price,
 * duration, and visibility per plan, saving to the plan_prices
 * override table -- the VIP tab, the actual Paystack charge, and the
 * activated plan's expiry all read the same merged values, so what
 * you set here is exactly what people see, pay, and get. Prices
 * changing week to week is the normal workflow here. Clearing a text
 * field restores that field's built-in default.
 */
function PlanSettingsEditor() {
  const [plans, setPlans] = useState<PlanSettings[]>([]);
  const [drafts, setDrafts] = useState<Record<string, PlanDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/plans");
    const json = await res.json();
    const items = (json.items ?? []) as PlanSettings[];
    setPlans(items);
    setDrafts(
      Object.fromEntries(
        items.map((p) => [
          p.id,
          { price: String(p.priceGHS), days: String(p.periodDays), tag: p.tag, title: p.title, subtitle: p.subtitle },
        ])
      )
    );
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const patchPlan = async (planId: string, body: Record<string, unknown>) => {
    setError("");
    setSavingId(planId);
    try {
      const res = await fetch("/api/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, ...body }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not save");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="bg-bg-secondary border border-border-subtle rounded-[16px] p-5 mb-8">
      <h2 className="font-archivo font-extrabold text-[15px] mb-1">Plan settings</h2>
      <p className="font-archivo text-[12px] text-text-secondary mb-4">
        Everything here applies immediately — the VIP tab, what Paystack charges, and how long a new subscription lasts. Hiding a plan takes
        it off the VIP tab (and blocks checkout) without deleting it. Clearing a text box restores that field&apos;s built-in wording. If you
        change a plan&apos;s duration, update the subtitle text to match — and avoid the word &quot;fixed&quot; in names (it&apos;s the
        match-fixing scammers&apos; word; &quot;Locked&quot; is the brand&apos;s honest equivalent).
      </p>
      <div className="flex flex-col gap-4">
        {plans.map((p) => {
          const draft = drafts[p.id] ?? { price: "", days: "", tag: "", title: "", subtitle: "" };
          const changed =
            draft.price !== String(p.priceGHS) ||
            draft.days !== String(p.periodDays) ||
            draft.tag !== p.tag ||
            draft.title !== p.title ||
            draft.subtitle !== p.subtitle;
          const busy = savingId === p.id;
          const textInput = "bg-bg-primary border border-border-subtle rounded-[8px] px-2.5 py-1.5 font-archivo text-[12px] text-text-primary outline-none focus:border-accent-lime placeholder:text-text-muted";
          return (
            <div key={p.id} className={`border border-border-subtle rounded-[12px] p-3 ${p.hidden ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-archivo font-bold text-[13px]">
                  {p.title}
                  {p.hidden && (
                    <span className="ml-2 font-archivo font-extrabold text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded-[5px] bg-white/8 text-text-muted">hidden</span>
                  )}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      patchPlan(p.id, {
                        priceGHS: Number(draft.price),
                        periodDays: Number(draft.days),
                        tag: draft.tag,
                        title: draft.title,
                        subtitle: draft.subtitle,
                      })
                    }
                    disabled={busy || !changed}
                    className="text-[12px] font-archivo font-extrabold bg-accent-lime text-bg-primary rounded-[8px] px-3 py-1.5 disabled:opacity-40"
                  >
                    {busy ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => patchPlan(p.id, { hidden: !p.hidden })}
                    disabled={busy}
                    className="text-[12px] font-archivo font-extrabold bg-white/8 text-text-secondary rounded-[8px] px-3 py-1.5 disabled:opacity-40"
                  >
                    {p.hidden ? "Show" : "Hide"}
                  </button>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-2 mb-2">
                <input
                  value={draft.tag}
                  onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...draft, tag: e.target.value } }))}
                  placeholder="Tag"
                  aria-label={`Tag for ${p.title}`}
                  maxLength={40}
                  className={textInput}
                />
                <input
                  value={draft.title}
                  onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...draft, title: e.target.value } }))}
                  placeholder="Plan name"
                  aria-label={`Name for ${p.title}`}
                  maxLength={60}
                  className={textInput}
                />
                <input
                  value={draft.subtitle}
                  onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...draft, subtitle: e.target.value } }))}
                  placeholder="Subtitle (e.g. 7 days · weekly)"
                  aria-label={`Subtitle for ${p.title}`}
                  maxLength={80}
                  className={textInput}
                />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[13px] text-text-muted">₵</span>
                  <input
                    value={draft.price}
                    onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...draft, price: e.target.value } }))}
                    inputMode="numeric"
                    aria-label={`Price for ${p.title}`}
                    className="w-20 bg-bg-primary border border-border-subtle rounded-[8px] px-2.5 py-1.5 font-mono text-[13px] text-text-primary outline-none focus:border-accent-lime"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    value={draft.days}
                    onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...draft, days: e.target.value } }))}
                    inputMode="numeric"
                    aria-label={`Duration in days for ${p.title}`}
                    className="w-16 bg-bg-primary border border-border-subtle rounded-[8px] px-2.5 py-1.5 font-mono text-[13px] text-text-primary outline-none focus:border-accent-lime"
                  />
                  <span className="font-archivo text-[11px] text-text-muted">days</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {error && <p className="text-accent-red text-[12px] font-archivo mt-3">{error}</p>}
    </section>
  );
}

/** A settled pick's row in the admin panel, with the bet-slip proof-photo upload/delete controls. */
function SettledPickRow({ pick, onChanged }: { pick: PickDTO; onChanged: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      Array.from(fileList).forEach((file) => form.append("files", file));
      const res = await fetch(`/api/picks/${pick.id}/proofs`, { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeProof = async (proofId: string) => {
    await fetch(`/api/picks/${pick.id}/proofs/${proofId}`, { method: "DELETE" });
    onChanged();
  };

  return (
    <div className="bg-bg-secondary border border-border-subtle rounded-[12px] p-3 text-[12px] font-archivo">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate">{pick.fixture} · {pick.market}</span>
        <span className={`font-extrabold flex-shrink-0 ${STATUS_COLOR[pick.status]}`}>{pick.status.toUpperCase()}</span>
      </div>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {pick.proofs.map((proof) => (
          <div key={proof.id} className="relative w-12 h-12 rounded-[8px] overflow-hidden border border-border-subtle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={proof.url} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => removeProof(proof.id)}
              aria-label="Remove proof photo"
              title="Remove proof photo"
              className="absolute top-0 right-0 bg-black/70 text-white text-[9px] px-1 leading-tight"
            >
              ✕
            </button>
          </div>
        ))}
        <label className="w-12 h-12 rounded-[8px] border border-dashed border-border-subtle flex items-center justify-center text-text-muted cursor-pointer">
          {uploading ? "…" : "+"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              upload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {error && <p className="text-accent-red text-[11px] mt-1">{error}</p>}
    </div>
  );
}

type MemberDTO = {
  id: string;
  name: string;
  login: string;
  role: "subscriber" | "admin";
  plan: string | null;
  planExpiresAt: string | null;
  createdAt: string;
};

const PLAN_OPTIONS = TIER_OPTIONS.filter((t) => t.id !== "free");

/** One member row: identity, plan status, and the manage actions (set/remove plan, reset password). */
function MemberRow({ member, onChanged }: { member: MemberDTO; onChanged: () => void }) {
  const [planChoice, setPlanChoice] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const act = async (body: Record<string, unknown>) => {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Action failed");
      setPlanChoice("");
      setNewPassword("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const planActive = isPlanActive(member.plan as Tier | null, member.planExpiresAt);

  return (
    <div className="bg-bg-primary border border-border-subtle rounded-[12px] p-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="font-archivo font-bold text-[13px] truncate">
            {member.name}
            {member.role === "admin" && (
              <span className="ml-2 font-archivo font-extrabold text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded-[5px] bg-accent-lime text-bg-primary">admin</span>
            )}
          </div>
          <div className="font-archivo text-[11px] text-text-secondary truncate">
            {member.login} · joined {formatShortDate(member.createdAt)}
          </div>
        </div>
        <div className="font-archivo text-[11px] text-right flex-shrink-0">
          {planActive ? (
            <span className="text-accent-lime font-bold">{member.plan} · until {formatShortDate(member.planExpiresAt!)}</span>
          ) : (
            <span className="text-text-muted">no active plan</span>
          )}
        </div>
      </div>

      {member.role !== "admin" && (
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          <select
            value={planChoice}
            onChange={(e) => setPlanChoice(e.target.value)}
            aria-label={`Plan to assign to ${member.name}`}
            className="bg-bg-secondary border border-border-subtle rounded-[8px] px-2 py-1.5 font-archivo text-[11px] text-text-secondary outline-none focus:border-accent-lime"
          >
            <option value="">Assign plan…</option>
            {PLAN_OPTIONS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <button
            onClick={() => planChoice && act({ action: "setPlan", planId: planChoice })}
            disabled={busy || !planChoice}
            className="text-[11px] font-archivo font-extrabold bg-accent-lime text-bg-primary rounded-[8px] px-2.5 py-1.5 disabled:opacity-40"
          >
            Apply
          </button>
          {planActive && (
            <button
              onClick={() => act({ action: "removePlan" })}
              disabled={busy}
              className="text-[11px] font-archivo font-extrabold bg-[rgba(255,77,77,0.13)] text-accent-red rounded-[8px] px-2.5 py-1.5 disabled:opacity-40"
            >
              Remove plan
            </button>
          )}
          <div className="flex items-center gap-1.5 ml-auto">
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              aria-label={`New password for ${member.name}`}
              type="text"
              className="w-[120px] bg-bg-secondary border border-border-subtle rounded-[8px] px-2 py-1.5 font-archivo text-[11px] text-text-primary outline-none focus:border-accent-lime placeholder:text-text-muted"
            />
            <button
              onClick={() => act({ action: "resetPassword", newPassword })}
              disabled={busy || newPassword.length < 6}
              className="text-[11px] font-archivo font-extrabold bg-white/8 text-text-secondary rounded-[8px] px-2.5 py-1.5 disabled:opacity-40"
            >
              Reset
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-accent-red text-[11px] font-archivo mt-1.5">{error}</p>}
    </div>
  );
}

/**
 * Members: create accounts for customers who don't have email
 * (username + password login), and manage everyone -- assign or
 * remove plans (cash sales), reset passwords for locked-out members.
 */
function MembersSection() {
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ name: "", username: "", password: "", planId: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createInfo, setCreateInfo] = useState("");

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/members${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      const json = await res.json();
      setMembers(json.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Debounced search-as-you-type (same fetch-on-mount pattern as the
    // rest of this page for the initial load).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const t = setTimeout(() => load(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const create = async () => {
    setCreateError("");
    setCreateInfo("");
    if (!draft.name || !draft.username || !draft.password) {
      setCreateError("Name, username, and password are all required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          username: draft.username,
          password: draft.password,
          planId: draft.planId || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not create the account");
      setCreateInfo(`Created — they log in with username "${json.username}" and the password you set.`);
      setDraft({ name: "", username: "", password: "", planId: "" });
      load(search.trim());
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not create the account");
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="bg-bg-secondary border border-border-subtle rounded-[16px] p-5 mt-8">
      <h2 className="font-archivo font-extrabold text-[15px] mb-1">Members</h2>
      <p className="font-archivo text-[12px] text-text-secondary mb-4">
        Create accounts for customers without email — they log in with the username and password you give them. Password resets for these
        accounts happen here too (there&apos;s no email to send a link to).
      </p>

      <div className="bg-bg-primary border border-border-subtle rounded-[12px] p-3 mb-4">
        <div className="font-archivo font-bold text-[11px] text-text-secondary uppercase tracking-wide mb-2">New member</div>
        <div className="grid sm:grid-cols-2 gap-2.5 mb-2.5">
          <input placeholder="Full name" aria-label="Member full name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} className={field} />
          <input
            placeholder="Username (letters/numbers, no spaces)"
            aria-label="Member username"
            value={draft.username}
            onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value }))}
            className={field}
          />
          <input placeholder="Starting password (min 6 chars)" aria-label="Member starting password" type="text" value={draft.password} onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))} className={field} />
          <select value={draft.planId} onChange={(e) => setDraft((d) => ({ ...d, planId: e.target.value }))} aria-label="Plan to assign on creation" className={field}>
            <option value="">No plan (account only)</option>
            {PLAN_OPTIONS.map((t) => (
              <option key={t.id} value={t.id}>{t.label} — paid directly</option>
            ))}
          </select>
        </div>
        {createError && <p className="text-accent-red text-[12px] font-archivo mb-2">{createError}</p>}
        {createInfo && <p className="text-accent-lime text-[12px] font-archivo mb-2">{createInfo}</p>}
        <button onClick={create} disabled={creating} className="bg-accent-lime text-bg-primary font-archivo font-extrabold text-[13px] rounded-[10px] px-4 py-2.5 disabled:opacity-60">
          {creating ? "Creating…" : "Create member"}
        </button>
      </div>

      <input
        placeholder="Search members by name or login…"
        aria-label="Search members"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`${field} mb-3`}
      />
      {loading ? (
        <p className="text-text-muted text-[13px] font-archivo">Loading members…</p>
      ) : members.length === 0 ? (
        <p className="text-text-muted text-[13px] font-archivo">{search ? "No members match that search." : "No members yet."}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <MemberRow key={m.id} member={m} onChanged={() => load(search.trim())} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function AdminPage() {
  const { pending, settled, loading, reload } = useAdminBoard();
  const liveScores = useLiveScores(pending);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-anton text-[28px] tracking-wider uppercase">TMTODDS Admin</h1>
        <Link href="/" className="font-archivo font-bold text-[13px] text-accent-lime">← Back to app</Link>
      </div>

      <NewPickForm onCreated={reload} />

      <PlanSettingsEditor />

      <section className="mb-8">
        <h2 className="font-archivo font-extrabold text-[15px] mb-4">Pending — needs settling ({pending.length})</h2>
        {loading ? (
          <p className="text-text-muted text-[13px] font-archivo">Loading…</p>
        ) : pending.length === 0 ? (
          <p className="text-text-muted text-[13px] font-archivo">No pending picks.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pending.map((p) => (
              <PendingPickCard
                key={p.id}
                pick={p}
                onSettled={reload}
                liveScore={p.externalFixtureId ? liveScores[p.externalFixtureId] : undefined}
              />
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
              <SettledPickRow key={p.id} pick={p} onChanged={reload} />
            ))}
          </div>
        )}
      </section>

      <MembersSection />
    </div>
  );
}
