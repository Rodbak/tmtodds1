"use client";

import { useState } from "react";
import { useApp } from "@/app/store/AppProvider";

export function AuthModal({ onClose }: { onClose: () => void }) {
  const { login, register } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError("");
    setInfo("");
    if (isRegister) {
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
    } else {
      if (!email || !password) {
        setError("Email and password required");
        return;
      }
      setSubmitting(true);
      const res = await login(email, password);
      setSubmitting(false);
      if (!res.ok) setError(res.error ?? "Invalid credentials");
      else onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-bg-secondary border border-border-subtle rounded-t-[24px] sm:rounded-[24px] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-archivo font-extrabold text-[18px] text-text-primary">{isRegister ? "Create account" : "Welcome back"}</h3>
          <button onClick={onClose} className="text-text-muted text-xs">Close</button>
        </div>
        {isRegister && (
          <input
            className="w-full bg-bg-primary border border-border-subtle rounded-[12px] px-4 py-3 font-archivo text-[13px] text-text-primary mb-3 outline-none focus:border-accent-lime"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          className="w-full bg-bg-primary border border-border-subtle rounded-[12px] px-4 py-3 font-archivo text-[13px] text-text-primary mb-3 outline-none focus:border-accent-lime"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full bg-bg-primary border border-border-subtle rounded-[12px] px-4 py-3 font-archivo text-[13px] text-text-primary mb-3 outline-none focus:border-accent-lime"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {info && <p className="text-accent-lime text-[11px] font-archivo mb-2 leading-snug">{info}</p>}
        {error && <p className="text-accent-red text-[11px] font-archivo mb-2">{error}</p>}
        <button onClick={submit} disabled={submitting} className="w-full bg-accent-lime text-bg-primary font-archivo font-extrabold text-[14px] rounded-[14px] py-3 disabled:opacity-60">
          {submitting ? "Please wait…" : isRegister ? "Sign up" : "Log in"}
        </button>
        <p className="text-center font-archivo font-medium text-[11px] text-text-muted mt-3">
          {isRegister ? "Already have an account?" : "New here?"}{" "}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
              setInfo("");
            }}
            className="text-accent-lime"
          >
            {isRegister ? "Log in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
