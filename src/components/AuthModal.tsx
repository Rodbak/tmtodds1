"use client";

import { useState } from "react";
import { useApp } from "@/app/store/AppProvider";

type Mode = "login" | "register" | "reset";

export function AuthModal({ onClose }: { onClose: () => void }) {
  const { login, register, requestPasswordReset } = useApp();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setInfo("");
  };

  const submit = async () => {
    setError("");
    setInfo("");

    if (mode === "reset") {
      if (!email) {
        setError("Enter your email first");
        return;
      }
      if (!email.includes("@")) {
        // Username accounts (created by admin for members without
        // email) have nowhere to send a reset link.
        setError("Username accounts don't have email — ask the admin to reset your password.");
        return;
      }
      setSubmitting(true);
      const res = await requestPasswordReset(email);
      setSubmitting(false);
      if (!res.ok) setError(res.error ?? "Could not send reset email");
      else setInfo(res.message ?? "Check your email for a reset link.");
      return;
    }

    if (mode === "register") {
      if (!name || !email || !password) {
        setError("All fields are required");
        return;
      }
      setSubmitting(true);
      const res = await register(name, email, password);
      setSubmitting(false);
      if (!res.ok) setError(res.error ?? "Could not create account");
      else if (res.message) setInfo(res.message);
      else onClose();
      return;
    }

    // mode === "login"
    if (!email || !password) {
      setError("Email/username and password required");
      return;
    }
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (!res.ok) setError(res.error ?? "Invalid credentials");
    else onClose();
  };

  const heading = mode === "register" ? "Create account" : mode === "reset" ? "Reset your password" : "Welcome back";
  const submitLabel = mode === "register" ? "Sign up" : mode === "reset" ? "Send reset link" : "Log in";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-bg-secondary border border-border-subtle rounded-t-[24px] sm:rounded-[24px] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-archivo font-extrabold text-[18px] text-text-primary">{heading}</h3>
          <button onClick={onClose} aria-label="Close" className="text-text-muted text-xs">Close</button>
        </div>

        {mode === "register" && (
          <input
            className="w-full bg-bg-primary border border-border-subtle rounded-[12px] px-4 py-3 font-archivo text-[13px] text-text-primary mb-3 outline-none focus:border-accent-lime"
            placeholder="Full name"
            aria-label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          className="w-full bg-bg-primary border border-border-subtle rounded-[12px] px-4 py-3 font-archivo text-[13px] text-text-primary mb-3 outline-none focus:border-accent-lime"
          placeholder={mode === "login" ? "Email or username" : "Email"}
          aria-label={mode === "login" ? "Email or username" : "Email"}
          type={mode === "login" ? "text" : "email"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {mode !== "reset" && (
          <input
            className="w-full bg-bg-primary border border-border-subtle rounded-[12px] px-4 py-3 font-archivo text-[13px] text-text-primary mb-3 outline-none focus:border-accent-lime"
            placeholder="Password"
            aria-label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        {mode === "login" && (
          <button onClick={() => switchMode("reset")} className="block text-right w-full font-archivo font-semibold text-[11px] text-text-muted mb-3 hover:text-accent-lime">
            Forgot password?
          </button>
        )}

        {mode === "register" && (
          <p className="font-archivo text-[10px] text-text-muted leading-snug mb-3">
            By creating an account you agree to our{" "}
            <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="underline">Terms</a> and{" "}
            <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>.
          </p>
        )}

        {info && <p className="text-accent-lime text-[11px] font-archivo mb-2 leading-snug">{info}</p>}
        {error && <p className="text-accent-red text-[11px] font-archivo mb-2">{error}</p>}

        <button onClick={submit} disabled={submitting} className="w-full bg-accent-lime text-bg-primary font-archivo font-extrabold text-[14px] rounded-[14px] py-3 disabled:opacity-60">
          {submitting ? "Please wait…" : submitLabel}
        </button>

        <p className="text-center font-archivo font-medium text-[11px] text-text-muted mt-3">
          {mode === "reset" ? (
            <button onClick={() => switchMode("login")} className="text-accent-lime">← Back to log in</button>
          ) : (
            <>
              {mode === "register" ? "Already have an account?" : "New here?"}{" "}
              <button onClick={() => switchMode(mode === "register" ? "login" : "register")} className="text-accent-lime">
                {mode === "register" ? "Log in" : "Create one"}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
