import { createContext } from "react";
import type { PickDTO, ChatMessageDTO, LedgerStats, LiveScoreDTO, Profile } from "@/lib/types";
import type { PlanId } from "@/lib/plans";

export type Tab = "home" | "slips" | "proof" | "vip" | "chat";
export type LedgerFilter = "all" | "won" | "lost" | "pending";

export type SlipItem = {
  pickId: string;
  odds: number;
};

export type AuthResult = { ok: boolean; error?: string; message?: string };

export type SendMessageOptions = {
  pinned?: boolean;
  attachedPickId?: string | null;
};

export type AppState = {
  tab: Tab;
  setTab: (t: Tab) => void;

  // Auth
  profile: Profile | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;

  // Today's board
  todayPicks: PickDTO[];
  picksLoading: boolean;
  toggleSlip: (id: string) => void;
  slipItems: SlipItem[];
  // Live scores for whichever today's-board picks have a kickoff in
  // progress, keyed by externalFixtureId. See src/lib/useLiveScores.ts.
  liveScores: Record<string, LiveScoreDTO>;

  // Proof & results
  ledger: PickDTO[];
  stats: LedgerStats | null;
  ledgerLoading: boolean;
  ledgerFilter: LedgerFilter;
  setLedgerFilter: (f: LedgerFilter) => void;

  // Chat
  chatMessages: ChatMessageDTO[];
  pinnedMessage: ChatMessageDTO | null;
  chatLocked: boolean;
  chatLoading: boolean;
  activeChannel: string;
  setActiveChannel: (c: string) => void;
  sendMessage: (text: string, opts?: SendMessageOptions) => Promise<AuthResult>;
  deleteMessage: (id: string) => Promise<AuthResult>;

  // Billing
  startCheckout: (planId: PlanId) => Promise<void>;
  checkoutLoading: boolean;
  checkoutError: string | null;

  refreshAll: () => void;
};

export const AppContext = createContext<AppState | null>(null);
