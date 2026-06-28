"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Tab, Pick, LedgerRow, ChatMsg, Subscription, SlipItem } from "./AppContext";
import { AppContext as Ctx, INITIAL_PICKS, INITIAL_LEDGER, INITIAL_CHAT, PLANS } from "./AppContext";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState<Tab>("home");
  const [picks, setPicks] = useState<Pick[]>(() => {
    try {
      const raw = localStorage.getItem("tmt_picks");
      return raw ? (JSON.parse(raw) as Pick[]) : INITIAL_PICKS;
    } catch { return INITIAL_PICKS; }
  });
  const [ledger, setLedger] = useState<LedgerRow[]>(() => {
    try {
      const raw = localStorage.getItem("tmt_ledger");
      return raw ? (JSON.parse(raw) as LedgerRow[]) : INITIAL_LEDGER;
    } catch { return INITIAL_LEDGER; }
  });
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>(() => {
    try {
      const raw = localStorage.getItem("tmt_chat");
      return raw ? (JSON.parse(raw) as ChatMsg[]) : INITIAL_CHAT;
    } catch { return INITIAL_CHAT; }
  });
  const [user, setUser] = useState<{ name: string; email: string; plan: string | null } | null>(() => {
    try {
      const raw = localStorage.getItem("tmt_user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  useEffect(() => { localStorage.setItem("tmt_picks", JSON.stringify(picks)); }, [picks]);
  useEffect(() => { localStorage.setItem("tmt_ledger", JSON.stringify(ledger)); }, [ledger]);
  useEffect(() => { localStorage.setItem("tmt_chat", JSON.stringify(chatMessages)); }, [chatMessages]);
  useEffect(() => { localStorage.setItem("tmt_user", JSON.stringify(user)); }, [user]);

  const toggleSlip = (id: string) => {
    setPicks(prev => prev.map(p => p.id === id ? { ...p, addedToSlip: !p.addedToSlip } : p));
  };

  const slipItems: SlipItem[] = picks.filter(p => p.addedToSlip && p.odds !== "••").map(p => ({
    pickId: p.id,
    odds: parseFloat(p.odds) || 1,
  }));

  const sendMessage = (text: string) => {
    if (!user) return;
    const now = new Date();
    const msg: ChatMsg = {
      id: Math.random().toString(36).slice(2),
      avatar: user.name.charAt(0).toUpperCase(),
      avatarColor: "bg-[#1f2937] text-accent-lime",
      name: user.name,
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text,
    };
    setChatMessages(prev => [...prev, msg]);
  };

  const login = (email: string, password: string) => {
    const raw = localStorage.getItem("tmt_auth");
    if (!raw) return false;
    try {
      const accounts: Record<string, { name: string; password: string }> = JSON.parse(raw);
      const account = accounts[email];
      if (!account) return false;
      if (account.password !== password) return false;
      const storedPlan = localStorage.getItem("tmt_plan_" + email) || null;
      setUser({ name: account.name, email, plan: storedPlan });
      return true;
    } catch { return false; }
  };

  const register = (name: string, email: string, password: string) => {
    const raw = localStorage.getItem("tmt_auth");
    const accounts: Record<string, { name: string; password: string }> = raw ? JSON.parse(raw) : {};
    if (accounts[email]) return false;
    accounts[email] = { name, password };
    localStorage.setItem("tmt_auth", JSON.stringify(accounts));
    setUser({ name, email, plan: null });
    return true;
  };

  const logout = () => setUser(null);

  const subscribe = (planId: string) => {
    if (!user) return;
    localStorage.setItem("tmt_plan_" + user.email, planId);
    setUser(prev => prev ? { ...prev, plan: planId } : prev);
  };

  const value = useMemo(() => ({
    tab, setTab,
    picks, toggleSlip, slipItems,
    ledger,
    chatMessages, sendMessage,
    user, login, register, logout, subscribe,
  }), [tab, picks, ledger, chatMessages, user, slipItems]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
