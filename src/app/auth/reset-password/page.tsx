"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

/**
 * Where Supabase's password-reset email links to. Clicking that link
 * signs the browser into a short-lived "recovery" session -- the
 * PASSWORD_RECOVERY event below is how we know that's what's
 * happening, as opposed to a normal sign-in. From there it's just a
 * normal updateUser({ password }) call.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // If the tab was already mid-recovery-session before this listener
    // attached, a session already existing is good enough to proceed.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const submit = async () => {
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/"), 1800);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg-primary text-text-primary px-6">
      <div className="max-w-sm w-full">
        <h1 className="font-anton text-[26px] tracking-wider uppercase mb-1">Set a new password</h1>
        {done ? (
          <p className="font-archivo text-[13px] text-accent-lime mt-4">Password updated — taking you back to TMTODDS…</p>
        ) : !ready ? (
          <p className="font-archivo text-[13px] text-text-secondary mt-4">
            Confirming your reset link… if this doesn&apos;t update in a few seconds, the link may have expired — request a new one from the login screen.
          </p>
        ) : (
          <>
            <p className="font-archivo text-[13px] text-text-secondary mt-2 mb-5">Choose a new password for your account.</p>
            <label className="sr-only" htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bg-secondary border border-border-subtle rounded-[12px] px-4 py-3 font-archivo text-[13px] text-text-primary mb-3 outline-none focus:border-accent-lime"
            />
            <label className="sr-only" htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-bg-secondary border border-border-subtle rounded-[12px] px-4 py-3 font-archivo text-[13px] text-text-primary mb-3 outline-none focus:border-accent-lime"
            />
            {error && <p className="text-accent-red text-[12px] font-archivo mb-3">{error}</p>}
            <button
              onClick={submit}
              disabled={submitting}
              className="w-full bg-accent-lime text-bg-primary font-archivo font-extrabold text-[14px] rounded-[14px] py-3 disabled:opacity-60"
            >
              {submitting ? "Updating…" : "Update password"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
