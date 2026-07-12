"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AppContext as Ctx, type Tab, type SlipItem, type AuthResult, type LedgerFilter, type SendMessageOptions } from "./AppContext";
import type { PickDTO, ChatMessageDTO, LedgerStats, Profile } from "@/lib/types";
import { PLANS, type PlanId, type PlanDef } from "@/lib/plans";
import { loginInputToEmail } from "@/lib/memberAuth";
import { useLiveScores } from "@/lib/useLiveScores";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());

  const [tab, setTab] = useState<Tab>("home");

  // Auth
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Today's board
  const [todayPicks, setTodayPicks] = useState<PickDTO[]>([]);
  const [picksLoading, setPicksLoading] = useState(true);
  const [slipIds, setSlipIds] = useState<Set<string>>(new Set());
  // Only poll for live scores while a tab that shows picks is open.
  const liveScores = useLiveScores(todayPicks, tab === "home" || tab === "slips");

  // Proof & results
  const [ledger, setLedger] = useState<PickDTO[]>([]);
  const [stats, setStats] = useState<LedgerStats | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerFilter, setLedgerFilter] = useState<LedgerFilter>("all");

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessageDTO[]>([]);
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessageDTO | null>(null);
  const [chatLocked, setChatLocked] = useState(false);
  const [chatLockReason, setChatLockReason] = useState<"auth" | "tier" | null>(null);
  const [chatLoading, setChatLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState("locked_vip");

  // Billing. Plans start from the compiled-in defaults and are
  // replaced by the server's effective list (with any admin price
  // overrides) as soon as it loads.
  const [plans, setPlans] = useState<PlanDef[]>(PLANS);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/plans");
      const json = await res.json();
      if (Array.isArray(json.items) && json.items.length > 0) setPlans(json.items);
    } catch {
      // Defaults stay in place -- a pricing fetch hiccup shouldn't
      // blank out the VIP tab.
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) {
      setProfile({
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        plan: data.plan,
        planExpiresAt: data.plan_expires_at,
      });
    } else {
      setProfile(null);
    }
  }, [supabase]);

  const fetchToday = useCallback(async () => {
    setPicksLoading(true);
    try {
      const res = await fetch("/api/picks?scope=today");
      const json = await res.json();
      setTodayPicks(json.items ?? []);
    } finally {
      setPicksLoading(false);
    }
  }, []);

  const fetchLedger = useCallback(async () => {
    setLedgerLoading(true);
    try {
      const res = await fetch("/api/picks?scope=ledger");
      const json = await res.json();
      setLedger(json.items ?? []);
      setStats(json.stats ?? null);
    } finally {
      setLedgerLoading(false);
    }
  }, []);

  const fetchChat = useCallback(async (channel: string) => {
    setChatLoading(true);
    try {
      const res = await fetch(`/api/chat?channel=${encodeURIComponent(channel)}`);
      const json = await res.json();
      setChatLocked(!!json.locked);
      setChatLockReason(json.locked ? (json.lockReason === "auth" ? "auth" : "tier") : null);
      setChatMessages(json.items ?? []);
      setPinnedMessage(json.pinned ?? null);
    } finally {
      setChatLoading(false);
    }
  }, []);

  // One-time initial load + auth state subscription. Each fetch*
  // helper sets its own loading flag to true synchronously before
  // awaiting -- the standard "fetch on mount" pattern React's own docs
  // recommend for apps without a data-fetching library. Disabling the
  // newer set-state-in-effect rule here is intentional, not an oversight.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile().finally(() => setAuthLoading(false));
    fetchToday();
    fetchLedger();
    fetchPlans();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
      fetchToday(); // re-fetch: locking depends on the signed-in plan
    });
    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile, fetchToday, fetchLedger, fetchPlans]);

  // Reload chat when the active channel changes, and poll gently while
  // the chat tab is open (simple, predictable "near real-time" without
  // standing up a websocket/Realtime subscription for a first version).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchChat(activeChannel);
  }, [activeChannel, fetchChat]);

  useEffect(() => {
    if (tab !== "chat") return;
    const id = setInterval(() => fetchChat(activeChannel), 6000);
    return () => clearInterval(id);
  }, [tab, activeChannel, fetchChat]);

  const toggleSlip = (id: string) => {
    setSlipIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const slipItems: SlipItem[] = todayPicks
    .filter((p) => slipIds.has(p.id) && p.odds !== null)
    .map((p) => ({ pickId: p.id, odds: p.odds as number }));

  const login = async (email: string, password: string): Promise<AuthResult> => {
    // Accepts a real email OR a username from an admin-created member
    // account (mapped to its synthetic address -- see lib/memberAuth).
    const { error } = await supabase.auth.signInWithPassword({ email: loginInputToEmail(email), password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const register = async (name: string, email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) return { ok: false, error: error.message };
    if (!data.session) {
      return { ok: true, message: "Check your email to confirm your account, then log in." };
    }
    return { ok: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const requestPasswordReset = async (email: string): Promise<AuthResult> => {
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "Check your email for a password reset link." };
  };

  const sendMessage = async (text: string, opts?: SendMessageOptions): Promise<AuthResult> => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: activeChannel,
        body: text,
        pinned: opts?.pinned ?? false,
        attachedPickId: opts?.attachedPickId ?? null,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: json.error ?? "Message failed to send" };
    await fetchChat(activeChannel);
    return { ok: true };
  };

  const deleteMessage = async (id: string): Promise<AuthResult> => {
    const res = await fetch(`/api/chat/${id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: json.error ?? "Could not delete message" };
    await fetchChat(activeChannel);
    return { ok: true };
  };

  const startCheckout = async (planId: PlanId) => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not start checkout");
      window.location.href = json.authorizationUrl;
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Could not start checkout");
      setCheckoutLoading(false);
    }
  };

  const refreshAll = () => {
    fetchProfile();
    fetchToday();
    fetchLedger();
    fetchChat(activeChannel);
    fetchPlans();
  };

  const value = {
    tab,
    setTab,
    profile,
    authLoading,
    login,
    register,
    logout,
    requestPasswordReset,
    todayPicks,
    picksLoading,
    toggleSlip,
    slipItems,
    liveScores,
    ledger,
    stats,
    ledgerLoading,
    ledgerFilter,
    setLedgerFilter,
    chatMessages,
    pinnedMessage,
    chatLocked,
    chatLockReason,
    chatLoading,
    activeChannel,
    setActiveChannel,
    sendMessage,
    deleteMessage,
    plans,
    startCheckout,
    checkoutLoading,
    checkoutError,
    refreshAll,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
