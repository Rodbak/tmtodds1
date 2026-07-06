"use client";

import { useState } from "react";
import { Zap, Users, Hash, Lock, Send, Pin } from "lucide-react";
import { useApp } from "@/app/store/AppProvider";
import { planCoversTier, isPlanActive } from "@/lib/plans";
import { ChatMessageBubble } from "./shared";
import { CHANNELS } from "./meta";

export function ChatTab({ onShowAuth }: { onShowAuth: () => void }) {
  const {
    profile,
    todayPicks,
    chatMessages,
    pinnedMessage,
    chatLocked,
    chatLoading,
    activeChannel,
    setActiveChannel,
    sendMessage,
    setTab,
  } = useApp();

  const [chatText, setChatText] = useState("");
  const [chatError, setChatError] = useState("");
  const [pinNext, setPinNext] = useState(false);
  const [attachPickId, setAttachPickId] = useState("");

  const isAdmin = profile?.role === "admin";
  const effectivePlan = profile && isPlanActive(profile.plan, profile.planExpiresAt) ? profile.plan : null;

  const handleSend = async () => {
    const text = chatText.trim();
    if (!text) return;
    setChatText("");
    setChatError("");
    const res = await sendMessage(text, { pinned: pinNext, attachedPickId: attachPickId || null });
    if (!res.ok) {
      setChatError(res.error ?? "Message failed to send");
      setChatText(text);
    } else {
      setPinNext(false);
      setAttachPickId("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Lounge header */}
      <div className="flex-shrink-0 px-5 pb-4 border-b border-border-subtle">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-accent-lime flex items-center justify-center">
              <Zap size={18} className="text-bg-primary" />
            </div>
            <div className="font-anton text-[18px] text-text-primary tracking-wider uppercase">TMT VIP LOUNGE</div>
          </div>
          <Users size={23} className="text-text-secondary" />
        </div>
        {/* Channel pills */}
        <div className="flex gap-1.5 mt-4 overflow-x-auto scrollbar-hide">
          {CHANNELS.map((c) => {
            const active = activeChannel === c.id;
            const locked = !planCoversTier(effectivePlan, c.requiresTier);
            return (
              <button
                key={c.id}
                onClick={() => setActiveChannel(c.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] font-archivo font-extrabold text-[11px] ${
                  active ? "bg-accent-lime text-bg-primary" : "bg-bg-secondary border border-border-subtle text-text-secondary"
                }`}
              >
                {locked ? <Lock size={11} className={active ? "" : "text-accent-gold"} /> : <Hash size={11} />}
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat scroll */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-4">
        {chatLoading ? (
          <div className="text-center py-8">
            <span className="font-archivo text-[12px] text-text-muted">Loading messages…</span>
          </div>
        ) : chatLocked ? (
          <div className="text-center py-10">
            <Lock size={22} className="text-accent-gold mx-auto mb-3" />
            <p className="font-archivo font-semibold text-[13px] text-text-secondary mb-3">This channel is part of a higher tier.</p>
            <button onClick={() => setTab("vip")} className="font-archivo font-bold text-[12px] text-accent-lime">
              See VIP packages →
            </button>
          </div>
        ) : (
          <>
            {pinnedMessage && (
              <div className="flex items-start gap-2.5 mb-5 p-3 rounded-[13px] bg-[rgba(204,255,51,0.08)] border border-border-lime">
                <Pin size={14} className="text-accent-lime flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="font-archivo font-extrabold text-[11px] text-accent-lime mb-0.5">Pinned by admin</div>
                  <div className="font-archivo font-medium text-[12px] text-[#C7CDD6] leading-snug">{pinnedMessage.body}</div>
                </div>
              </div>
            )}
            {chatMessages.length === 0 ? (
              <div className="text-center py-10">
                <span className="font-archivo text-[12px] text-text-muted">No messages yet — be the first to say something.</span>
              </div>
            ) : (
              chatMessages.map((m) => <ChatMessageBubble key={m.id} message={m} />)
            )}
          </>
        )}
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 px-4 pb-3 pt-2.5 border-t border-border-subtle">
        {chatError && <p className="text-accent-red text-[11px] font-archivo mb-1.5 px-1">{chatError}</p>}
        {!profile ? (
          <button onClick={onShowAuth} className="w-full text-center font-archivo font-bold text-[12px] text-accent-lime py-2">
            Log in to chat →
          </button>
        ) : chatLocked ? null : (
          <div className="flex flex-col gap-2">
            {isAdmin && (
              <div className="flex items-center gap-2">
                <select
                  value={attachPickId}
                  onChange={(e) => setAttachPickId(e.target.value)}
                  className="flex-1 min-w-0 bg-bg-secondary border border-border-subtle rounded-[9px] px-2.5 py-1.5 font-archivo font-medium text-[11px] text-text-secondary outline-none focus:border-accent-lime"
                >
                  <option value="">Attach a pick (optional)</option>
                  {todayPicks.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fixture}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setPinNext((v) => !v)}
                  title="Pin this message to the channel"
                  className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-[9px] font-archivo font-extrabold text-[10px] uppercase tracking-wide ${
                    pinNext ? "bg-accent-lime text-bg-primary" : "bg-bg-secondary border border-border-subtle text-text-secondary"
                  }`}
                >
                  <Pin size={12} /> Pin
                </button>
              </div>
            )}
            <div className="flex items-center gap-2.5 bg-bg-secondary border border-white/10 rounded-[14px] px-4 py-2.5">
              <input
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder={`Message #${CHANNELS.find((c) => c.id === activeChannel)?.label ?? activeChannel}`}
                className="flex-1 bg-transparent font-archivo font-medium text-[13px] text-text-primary outline-none placeholder:text-text-muted"
              />
              <button onClick={handleSend} className="w-8 h-8 rounded-[9px] bg-accent-lime flex items-center justify-center flex-shrink-0 flex-none">
                <Send size={15} className="text-bg-primary" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
