"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AppContext as Ctx, type Tab, type SlipItem, type AuthResult } from "./AppContext";
import type { PickDTO, ChatMessageDTO, LedgerStats, Profile } from "@/lib/types";
import type { PlanId } from "@/lib/plans";

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

  // Proof & results
  const [ledger, setLedger] = useState<PickDTO[]>([]);
  const [stats, setStats] = useState<LedgerStats | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(true);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessageDTO[]>([]);
  const [chatLocked, setChatLocked] = useState(false);
  const [chatLoading, setChatLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState("general");

  // Billing
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

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
      setChatMessages(json.items ?? []);
    } finally {
      setChatLoading(false);
    }
  }, []);

  // One-time initial load + auth state subscription. Each fetch*
  // helper sets its own loading flag to true synchronously before
  // awaiting — the standard "fetch on mount" pattern React's own docs
  // recommend for apps without a data-fetching library. Disabling the
  // newer set-state-in-effect rule here is intentional, not an oversight.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile().finally(() => setAuthLoading(false));
    fetchToday();
    fetchLedger();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
      fetchToday(); // re-fetch: locking depends on the signed-in plan
    });
    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile, fetchToday, fetchLedger]);

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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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

  const sendMessage = async (text: string): Promise<AuthResult> => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: activeChannel, body: text }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: json.error ?? "Message failed to send" };
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
  };

  const value = {
    tab,
    setTab,
    profile,
    authLoading,
    login,
    register,
    logout,
    todayPicks,
    picksLoading,
    toggleSlip,
    slipItems,
    ledger,
    stats,
    ledgerLoading,
    chatMessages,
    chatLocked,
    chatLoading,
    activeChannel,
    setActiveChannel,
    sendMessage,
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
