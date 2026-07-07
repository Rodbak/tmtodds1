import { createAdminClient } from "@/lib/supabase/server";

/**
 * Checks and increments a sliding-window counter atomically in
 * Postgres (see check_rate_limit() in schema.sql). Returns true if
 * the request is within limits, false if it should be rejected.
 *
 * Fails open (allows the request) if the rate-limit check itself
 * errors -- a rate limiter with a bug shouldn't be able to take the
 * whole app down; log it instead so the actual problem gets fixed.
 */
export async function checkRateLimit(key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
  const db = createAdminClient();
  const { data, error } = await db.rpc("check_rate_limit", {
    p_key: key,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("Rate limit check failed, allowing request:", error.message);
    return true;
  }
  return data === true;
}

export const RATE_LIMITS = {
  // Chat: generous enough for a real conversation, tight enough to
  // stop a scripted flood of a channel.
  CHAT_POST: { max: 15, windowSeconds: 60 },
  // Checkout: nothing legitimate needs more than a handful of
  // attempts in an hour; this mostly guards against a broken retry
  // loop or someone scripting fake-payment rows.
  CHECKOUT_INIT: { max: 10, windowSeconds: 60 * 60 },
} as const;
