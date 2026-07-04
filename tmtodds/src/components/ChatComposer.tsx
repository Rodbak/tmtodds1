"use client";

import { Send } from "lucide-react";

interface ChatComposerProps {
  chatText: string;
  onChatTextChange: (value: string) => void;
  onSend: () => void;
  chatError: string;
  profile: { name: string; role: string } | null;
  chatLocked: boolean;
  activeChannel: string;
  onRequestAuth: () => void;
}

export default function ChatComposer({
  chatText,
  onChatTextChange,
  onSend,
  chatError,
  profile,
  chatLocked,
  activeChannel,
  onRequestAuth,
}: ChatComposerProps) {
  return (
    <div className="flex-shrink-0 px-4 pb-3 pt-2.5 border-t border-border-subtle">
      {chatError && <p className="text-accent-red text-[11px] font-archivo mb-1.5 px-1">{chatError}</p>}
      {!profile ? (
        <button onClick={onRequestAuth} className="w-full text-center font-archivo font-bold text-[12px] text-accent-lime py-2">Log in to chat →</button>
      ) : chatLocked ? null : (
        <div className="flex items-center gap-2.5 bg-bg-secondary border border-white/10 rounded-[14px] px-4 py-2.5">
          <input
            value={chatText}
            onChange={(e) => onChatTextChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
            placeholder={`Message #${activeChannel}`}
            className="flex-1 bg-transparent font-archivo font-medium text-[13px] text-text-primary outline-none placeholder:text-text-muted"
          />
          <button onClick={onSend} className="w-8 h-8 rounded-[9px] bg-accent-lime flex items-center justify-center flex-shrink-0 flex-none">
            <Send size={15} className="text-bg-primary" />
          </button>
        </div>
      )}
    </div>
  );
}