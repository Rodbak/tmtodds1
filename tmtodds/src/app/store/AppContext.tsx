import { createContext } from "react";
import type { PickDTO, ChatMessageDTO, LedgerStats, Profile } from "@/lib/types";
import type { PlanId } from "@/lib/plans";

export type Tab = "home" | "slips" | "proof" | "vip" | "chat";

export type SlipItem = {
  pickId: string;
  odds: number;
};

export type AuthResult = { ok: boolean; error?: string; message?: string };

export type AppState = {
  tab: Tab;
  setTab: (t: Tab) => void;

  // Auth
  profile: Profile | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;

  // Today's board
  todayPicks: PickDTO[];
  picksLoading: boolean;
  toggleSlip: (id: string) => void;
  slipItems: SlipItem[];

  // Proof & results
  ledger: PickDTO[];
  stats: LedgerStats | null;
  ledgerLoading: boolean;

  // Chat
  chatMessages: ChatMessageDTO[];
  chatLocked: boolean;
  chatLoading: boolean;
  activeChannel: string;
  setActiveChannel: (c: string) => void;
  sendMessage: (text: string) => Promise<AuthResult>;

  // Billing
  startCheckout: (planId: PlanId) => Promise<void>;
  checkoutLoading: boolean;
  checkoutError: string | null;

  refreshAll: () => void;
};

export const AppContext = createContext<AppState | null>(null);
