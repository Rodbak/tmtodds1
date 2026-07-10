import type { Tier, PlanId } from "./plans";

export type UserRole = "subscriber" | "admin";

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: PlanId | null;
  planExpiresAt: string | null;
};

export type PickStatus = "pending" | "won" | "lost" | "void";

export type PickProofDTO = {
  id: string;
  url: string;
};

// Shape returned by GET /api/picks. When `locked` is true, market and
// odds are stripped server-side before the response is sent -- the
// client never receives data it isn't allowed to show.
export type PickDTO = {
  id: string;
  league: string;
  fixture: string;
  kickoffAt: string;
  tier: Tier;
  status: PickStatus;
  resultNote: string | null;
  locked: boolean;
  market: string | null;
  odds: number | null;
  externalFixtureId: string | null;
  // Bet-slip screenshots for this pick. Only populated on the ledger
  // scope (settled results) -- the "today" board never fetches these.
  proofs: PickProofDTO[];
};

// One fixture's current state from the live-scores provider. `status`
// is the provider's short code: NS (not started), 1H/HT/2H/ET/P/BT
// (in progress in some form), FT/AET/PEN (finished), PST/CANC/ABD
// (postponed/cancelled/abandoned).
export type LiveScoreDTO = {
  externalFixtureId: string;
  status: string;
  elapsed: number | null;
  homeScore: number | null;
  awayScore: number | null;
};

export type LedgerStats = {
  winRate30: number | null;
  wonLast30: number;
  lostLast30: number;
  streak: number;
  totalDelivered: number;
};

export type ChatAttachedPick = {
  league: string;
  fixture: string;
  kickoffAt: string;
  tier: Tier;
  status: PickStatus;
  locked: boolean;
  market: string | null;
  odds: number | null;
};

export type ChatMessageDTO = {
  id: string;
  authorId: string | null;
  authorName: string;
  isAdmin: boolean;
  isPinned: boolean;
  channel: string;
  body: string;
  attachedPick: ChatAttachedPick | null;
  createdAt: string;
};
